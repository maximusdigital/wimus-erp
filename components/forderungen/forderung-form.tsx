"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  forderungFormSchema,
  type ForderungFormValues,
} from "@/lib/validations/forderung"
import {
  FORDERUNG_STATUS,
  FORDERUNG_STATUS_LABELS,
  FORDERUNG_TYPEN,
  FORDERUNG_TYP_LABELS,
  type Forderung,
} from "@/types/forderung"
import { kontaktName } from "@/types/kontakt"
import type { KontaktRef } from "@/types/vertrag"
import { schadenEskalation } from "@/lib/utils/forderungen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

export type VertragOption = { id: string; label: string }

function emptyValues(prefill?: {
  kontaktId?: string
  vertragId?: string
}): ForderungFormValues {
  return {
    kontakt_id: prefill?.kontaktId ?? "",
    mietvertrag_id: prefill?.vertragId ?? "",
    einheit_id: "",
    forderung_typ: "miete",
    schaden_typ: "",
    betrag: "",
    faellig_am: "",
    bezahlt_betrag: "",
    bezahlt_am: "",
    status: "offen",
    notiz: "",
  }
}

function toFormValues(f: Forderung): ForderungFormValues {
  const s = (x: string | null) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    kontakt_id: s(f.kontakt_id),
    mietvertrag_id: s(f.mietvertrag_id),
    einheit_id: s(f.einheit_id),
    forderung_typ: f.forderung_typ as ForderungFormValues["forderung_typ"],
    schaden_typ: s(f.schaden_typ),
    betrag: n(f.betrag),
    faellig_am: d(f.faellig_am),
    bezahlt_betrag: n(f.bezahlt_betrag),
    bezahlt_am: d(f.bezahlt_am),
    status: f.status as ForderungFormValues["status"],
    notiz: s(f.notiz),
  }
}

const NONE = "__none__"

export function ForderungForm({
  forderung,
  kontakte,
  vertraege,
  defaultKontaktId,
  defaultVertragId,
}: {
  forderung?: Forderung
  kontakte: KontaktRef[]
  vertraege: VertragOption[]
  defaultKontaktId?: string
  defaultVertragId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(forderung)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ForderungFormValues>({
    resolver: zodResolver(forderungFormSchema),
    defaultValues: forderung
      ? toFormValues(forderung)
      : emptyValues({ kontaktId: defaultKontaktId, vertragId: defaultVertragId }),
  })

  const typ = form.watch("forderung_typ")
  const betrag = form.watch("betrag")
  const istSachschaden = typ === "sachschaden"

  let eskalationHinweis: string | null = null
  if (istSachschaden && betrag && !Number.isNaN(Number(betrag))) {
    const e = schadenEskalation(Number(betrag))
    eskalationHinweis = `Empfehlung: ${e.label} (Stufe ${e.stufe})`
  }

  async function onSubmit(values: ForderungFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/forderungen/${forderung!.id}` : "/api/forderungen",
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
        ? `/finanzen/forderungen/${forderung!.id}`
        : `/finanzen/forderungen/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="kontakt_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Kontakt <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kontakt wählen…">
                        {(v) => {
                          const k = kontakte.find((x) => x.id === v)
                          return k ? kontaktName(k) : "Kontakt wählen…"
                        }}
                      </SelectValue>
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
            name="forderung_typ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Forderungsart <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => FORDERUNG_TYP_LABELS[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORDERUNG_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {FORDERUNG_TYP_LABELS[t]}
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
            name="mietvertrag_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertrag</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keiner —">
                        {(v) =>
                          v && v !== NONE
                            ? (vertraege.find((x) => x.id === v)?.label ??
                              "— keiner —")
                            : "— keiner —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keiner —</SelectItem>
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
            name="betrag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Betrag (€) <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faellig_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fällig am <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Status <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => FORDERUNG_STATUS_LABELS[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORDERUNG_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {FORDERUNG_STATUS_LABELS[s]}
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
            name="bezahlt_betrag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bereits bezahlt (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {istSachschaden ? (
            <FormField
              control={form.control}
              name="schaden_typ"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schadensart</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Wasserschaden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        {eskalationHinweis ? (
          <div className="bg-secondary/10 rounded-md p-2 text-sm">
            {eskalationHinweis}
          </div>
        ) : null}

        <FormField
          control={form.control}
          name="notiz"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notiz</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                : "Forderung anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
