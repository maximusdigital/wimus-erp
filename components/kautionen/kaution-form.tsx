"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  kautionFormSchema,
  type KautionFormValues,
} from "@/lib/validations/kaution"
import {
  KAUTION_ANLAGE_ARTEN,
  KAUTION_ANLAGE_ART_LABELS,
  KAUTION_STATUS,
  KAUTION_STATUS_LABELS,
  type Kaution,
} from "@/types/kaution"
import type { VertragOption } from "@/lib/finanzen-options"
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

function emptyValues(prefill?: { vertragId?: string }): KautionFormValues {
  return {
    mietvertrag_id: prefill?.vertragId ?? "",
    betrag: "",
    anlage_art: "",
    zinssatz: "",
    zinsen_kumuliert: "",
    rueckzahlung_datum: "",
    status: "angelegt",
  }
}

function toFormValues(k: Kaution): KautionFormValues {
  const s = (x: string | null) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    mietvertrag_id: s(k.mietvertrag_id),
    betrag: n(k.betrag),
    anlage_art: s(k.anlage_art),
    zinssatz: n(k.zinssatz),
    zinsen_kumuliert: n(k.zinsen_kumuliert),
    rueckzahlung_datum: d(k.rueckzahlung_datum),
    status: k.status as KautionFormValues["status"],
  }
}

export function KautionForm({
  kaution,
  vertraege,
  defaultVertragId,
}: {
  kaution?: Kaution
  vertraege: VertragOption[]
  defaultVertragId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(kaution)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<KautionFormValues>({
    resolver: zodResolver(kautionFormSchema),
    defaultValues: kaution
      ? toFormValues(kaution)
      : emptyValues({ vertragId: defaultVertragId }),
  })

  async function onSubmit(values: KautionFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/kautionen/${kaution!.id}` : "/api/kautionen",
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
        ? `/finanzen/kautionen/${kaution!.id}`
        : `/finanzen/kautionen/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="mietvertrag_id"
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
                    {KAUTION_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {KAUTION_STATUS_LABELS[s]}
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
            name="betrag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Betrag (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="2340" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anlage_art"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anlageart</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KAUTION_ANLAGE_ARTEN.map((a) => (
                      <SelectItem key={a} value={a}>
                        {KAUTION_ANLAGE_ART_LABELS[a]}
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
            name="zinssatz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zinssatz (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zinsen_kumuliert"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zinsen kumuliert (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rueckzahlung_datum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rückzahlung am</FormLabel>
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
                : "Kaution anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
