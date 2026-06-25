"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { firmaFormSchema, type FirmaFormValues } from "@/lib/validations/firma"
import type { Firma } from "@/types/firma"
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

export type FirmaEdit = Firma & {
  geschaeftsfuehrer: string | null
  handelsregister_nr: string | null
  handelsregister_gericht: string | null
  steuernummer: string | null
  ust_id: string | null
  datev_mandant_nr: string | null
  iban: string | null
  bic: string | null
  mutter_firma_id: string | null
  ci_farbe_primary: string | null
  aktiv: boolean | null
}

const NONE = "__none__"

const TEXT_FIELDS: { name: keyof FirmaFormValues; label: string; placeholder?: string }[] = [
  { name: "rechtsform", label: "Rechtsform", placeholder: "z. B. GmbH" },
  { name: "geschaeftsfuehrer", label: "Geschäftsführer" },
  { name: "handelsregister_nr", label: "Handelsregister-Nr." },
  { name: "handelsregister_gericht", label: "HR-Gericht" },
  { name: "steuernummer", label: "Steuernummer" },
  { name: "ust_id", label: "USt-IdNr." },
  { name: "datev_mandant_nr", label: "DATEV-Mandant-Nr." },
  { name: "iban", label: "IBAN" },
  { name: "bic", label: "BIC" },
]

export function FirmaForm({
  firma,
  firmen,
}: {
  firma?: FirmaEdit
  firmen: Firma[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FirmaFormValues>({
    resolver: zodResolver(firmaFormSchema),
    defaultValues: {
      name: firma?.name ?? "",
      kuerzel: firma?.kuerzel ?? "",
      rechtsform: firma?.rechtsform ?? "",
      geschaeftsfuehrer: firma?.geschaeftsfuehrer ?? "",
      handelsregister_nr: firma?.handelsregister_nr ?? "",
      handelsregister_gericht: firma?.handelsregister_gericht ?? "",
      steuernummer: firma?.steuernummer ?? "",
      ust_id: firma?.ust_id ?? "",
      datev_mandant_nr: firma?.datev_mandant_nr ?? "",
      iban: firma?.iban ?? "",
      bic: firma?.bic ?? "",
      mutter_firma_id: firma?.mutter_firma_id ?? "",
      ci_farbe_primary: firma?.ci_farbe_primary ?? "",
      aktiv: firma?.aktiv === false ? "nein" : "ja",
    },
  })

  async function onSubmit(values: FirmaFormValues) {
    setError(null)
    const url = firma ? `/api/firmen/${firma.id}` : "/api/firmen"
    const res = await fetch(url, {
      method: firma ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    router.push("/einstellungen/firmen")
    router.refresh()
  }

  const mutterOptions = firmen.filter((f) => f.id !== firma?.id)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex max-w-[720px] flex-col gap-4"
      >
        {error ? (
          <div className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kuerzel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kürzel</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {TEXT_FIELDS.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={f.placeholder} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="mutter_firma_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mutterfirma</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keine —">
                        {(v) =>
                          v && v !== NONE
                            ? (firmen.find((f) => f.id === v)?.name ?? "— keine —")
                            : "— keine —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keine —</SelectItem>
                    {mutterOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
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
            name="ci_farbe_primary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CI-Primärfarbe</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value || "#1F4E5F"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="size-8 shrink-0 rounded-md border"
                      aria-label="Farbe wählen"
                    />
                    <Input {...field} placeholder="#1F4E5F" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aktiv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aktiv</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => (v === "nein" ? "Inaktiv" : "Aktiv")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ja">Aktiv</SelectItem>
                    <SelectItem value="nein">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/einstellungen/firmen")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {firma ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
