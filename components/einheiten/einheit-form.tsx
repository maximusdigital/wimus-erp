"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  einheitFormSchema,
  type EinheitFormValues,
} from "@/lib/validations/einheit"
import {
  EINHEITSTYPEN,
  EINHEITSTYP_LABELS,
  EINHEIT_STATUS,
  EINHEIT_STATUS_LABELS,
  type Einheit,
  type ObjektOption,
} from "@/types/einheit"
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

function emptyValues(objektId?: string): EinheitFormValues {
  return {
    objekt_id: objektId ?? "",
    bezeichnung: "",
    lage: "",
    verwendungszweck_code: "",
    einheitstyp: "",
    status: "frei",
    wohnflaeche_qm: "",
    zimmer_anzahl: "",
    etage: "",
  }
}

function toFormValues(e: Einheit): EinheitFormValues {
  const s = (v: string | null) => v ?? ""
  const n = (v: number | null) => (v == null ? "" : String(v))
  return {
    objekt_id: e.objekt_id,
    bezeichnung: s(e.bezeichnung),
    lage: s(e.lage),
    verwendungszweck_code: s(e.verwendungszweck_code),
    einheitstyp: s(e.einheitstyp),
    status: e.status as EinheitFormValues["status"],
    wohnflaeche_qm: n(e.wohnflaeche_qm),
    zimmer_anzahl: n(e.zimmer_anzahl),
    etage: s(e.etage),
  }
}

export function EinheitForm({
  einheit,
  objekte,
  defaultObjektId,
}: {
  einheit?: Einheit
  objekte: ObjektOption[]
  defaultObjektId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(einheit)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<EinheitFormValues>({
    resolver: zodResolver(einheitFormSchema),
    defaultValues: einheit ? toFormValues(einheit) : emptyValues(defaultObjektId),
  })

  async function onSubmit(values: EinheitFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/einheiten/${einheit!.id}` : "/api/einheiten",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setServerError(
        res.status === 409
          ? "Eine Einheit mit diesem Verwendungszweck-Code existiert bereits."
          : (body?.error ?? "Speichern fehlgeschlagen.")
      )
      return
    }

    const saved = await res.json().catch(() => null)
    router.push(
      isEdit ? `/einheiten/${einheit!.id}` : `/einheiten/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="objekt_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-1">
                <FormLabel>Objekt *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Objekt wählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {objekte.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.kuerzel}
                        {o.bezeichnung ? ` – ${o.bezeichnung}` : ""}
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
            name="bezeichnung"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bezeichnung</FormLabel>
                <FormControl>
                  <Input placeholder="Wohnung 3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="verwendungszweck_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verwendungszweck-Code</FormLabel>
                <FormControl>
                  <Input placeholder="BHS16W3Z1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="einheitstyp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Einheitstyp</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EINHEITSTYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EINHEITSTYP_LABELS[t]}
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
                    {EINHEIT_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {EINHEIT_STATUS_LABELS[s]}
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
            name="lage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lage</FormLabel>
                <FormControl>
                  <Input placeholder="EG links" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="etage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etage</FormLabel>
                <FormControl>
                  <Input placeholder="2. OG" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wohnflaeche_qm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wohnfläche (m²)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="78" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zimmer_anzahl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zimmer</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" placeholder="3" {...field} />
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
                : "Einheit anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
