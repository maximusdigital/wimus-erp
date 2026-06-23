"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  mahnungFormSchema,
  type MahnungFormValues,
} from "@/lib/validations/mahnung"
import {
  MAHN_STATUS,
  MAHN_STATUS_LABELS,
  MAHN_STUFEN,
  MAHN_STUFE_LABELS,
  mahnungGesamt,
  type Mahnung,
} from "@/types/mahnung"
import type { VertragOption } from "@/lib/finanzen-options"
import type { KontaktRef } from "@/types/vertrag"
import { kontaktName } from "@/types/kontakt"
import { formatEUR } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

function emptyValues(prefill?: { vertragId?: string }): MahnungFormValues {
  return {
    vertrag_id: prefill?.vertragId ?? "",
    mieter_id: "",
    stufe: "1",
    hauptforderung: "",
    zinsen: "",
    gebuehren: "",
    faellig_am: "",
    versendet_am: "",
    status: "offen",
  }
}

function toFormValues(m: Mahnung): MahnungFormValues {
  const s = (x: string | null) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    vertrag_id: s(m.vertrag_id),
    mieter_id: s(m.mieter_id),
    stufe: String(m.stufe ?? 1),
    hauptforderung: n(m.hauptforderung),
    zinsen: n(m.zinsen),
    gebuehren: n(m.gebuehren),
    faellig_am: d(m.faellig_am),
    versendet_am: d(m.versendet_am),
    status: m.status as MahnungFormValues["status"],
  }
}

export function MahnungForm({
  mahnung,
  vertraege,
  kontakte,
  defaultVertragId,
}: {
  mahnung?: Mahnung
  vertraege: VertragOption[]
  kontakte: KontaktRef[]
  defaultVertragId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(mahnung)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<MahnungFormValues>({
    resolver: zodResolver(mahnungFormSchema),
    defaultValues: mahnung
      ? toFormValues(mahnung)
      : emptyValues({ vertragId: defaultVertragId }),
  })

  const gesamt = mahnungGesamt({
    hauptforderung: Number(form.watch("hauptforderung")) || 0,
    zinsen: Number(form.watch("zinsen")) || 0,
    gebuehren: Number(form.watch("gebuehren")) || 0,
  })

  async function onSubmit(values: MahnungFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/mahnungen/${mahnung!.id}` : "/api/mahnungen",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setServerError(body?.error ?? "Speichern fehlgeschlagen.")
      return
    }

    const saved = await res.json().catch(() => null)
    router.push(
      isEdit
        ? `/finanzen/mahnungen/${mahnung!.id}`
        : `/finanzen/mahnungen/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="stufe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stufe *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MAHN_STUFEN.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} – {MAHN_STUFE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MAHN_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {MAHN_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vertrag_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertrag</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Vertrag wählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vertraege.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mieter_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mieter</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kontakt wählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {kontakte.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {kontaktName(k)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hauptforderung"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hauptforderung (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="780" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zinsen"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zinsen (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gebuehren"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gebühren (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Gesamt (€)</FormLabel>
            <FormControl>
              <Input value={formatEUR(gesamt)} readOnly disabled />
            </FormControl>
            <p className="text-muted-foreground text-xs">
              Wird automatisch berechnet.
            </p>
          </FormItem>

          <FormField
            control={form.control}
            name="faellig_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fällig am</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="versendet_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versendet am</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError ? (
          <p className="text-destructive text-sm">{serverError}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Speichern…"
              : isEdit
                ? "Änderungen speichern"
                : "Mahnung anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
