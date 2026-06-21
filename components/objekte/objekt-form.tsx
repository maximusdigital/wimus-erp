"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  objektFormSchema,
  type ObjektFormValues,
} from "@/lib/validations/objekt"
import type { Objekt } from "@/types/objekt"
import {
  HALTESTRATEGIEN,
  HALTESTRATEGIE_LABELS,
  OBJEKTTYPEN,
  OBJEKTTYP_LABELS,
  OBJEKT_STATUS,
  OBJEKT_STATUS_LABELS,
} from "@/types/objekt"
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

const EMPTY_VALUES: ObjektFormValues = {
  kuerzel: "",
  bezeichnung: "",
  strasse: "",
  hausnummer: "",
  plz: "",
  ort: "",
  objekttyp: "",
  haltestrategie: "",
  status: "ist",
  baujahr: "",
  wohnflaeche_qm: "",
  marktwert_sprengnetter: "",
  marktwert_pricehubble: "",
  nutzen_lasten_datum: "",
  notartermin_datum: "",
  notiz: "",
}

function toFormValues(o: Objekt): ObjektFormValues {
  const s = (v: string | null) => v ?? ""
  const n = (v: number | null) => (v == null ? "" : String(v))
  const d = (v: string | null) => (v ? v.slice(0, 10) : "")
  return {
    kuerzel: o.kuerzel,
    bezeichnung: s(o.bezeichnung),
    strasse: s(o.strasse),
    hausnummer: s(o.hausnummer),
    plz: s(o.plz),
    ort: s(o.ort),
    objekttyp: s(o.objekttyp),
    haltestrategie: s(o.haltestrategie),
    status: o.status as ObjektFormValues["status"],
    baujahr: n(o.baujahr),
    wohnflaeche_qm: n(o.wohnflaeche_qm),
    marktwert_sprengnetter: n(o.marktwert_sprengnetter),
    marktwert_pricehubble: n(o.marktwert_pricehubble),
    nutzen_lasten_datum: d(o.nutzen_lasten_datum),
    notartermin_datum: d(o.notartermin_datum),
    notiz: s(o.notiz),
  }
}

export function ObjektForm({ objekt }: { objekt?: Objekt }) {
  const router = useRouter()
  const isEdit = Boolean(objekt)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ObjektFormValues>({
    resolver: zodResolver(objektFormSchema),
    defaultValues: objekt ? toFormValues(objekt) : EMPTY_VALUES,
  })

  async function onSubmit(values: ObjektFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/objekte/${objekt!.id}` : "/api/objekte",
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
          ? "Ein Objekt mit diesem Kürzel existiert bereits."
          : (body?.error ?? "Speichern fehlgeschlagen.")
      )
      return
    }

    router.push(isEdit ? `/objekte/${objekt!.id}` : "/objekte")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="kuerzel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kürzel *</FormLabel>
                <FormControl>
                  <Input placeholder="BHS16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bezeichnung"
            render={({ field }) => (
              <FormItem className="sm:col-span-1 lg:col-span-2">
                <FormLabel>Bezeichnung</FormLabel>
                <FormControl>
                  <Input placeholder="Bauhofstr. 16 – MFH" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strasse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Straße</FormLabel>
                <FormControl>
                  <Input placeholder="Bauhofstraße" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hausnummer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hausnummer</FormLabel>
                <FormControl>
                  <Input placeholder="16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="plz"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>PLZ</FormLabel>
                  <FormControl>
                    <Input placeholder="71640" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ort"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Ort</FormLabel>
                  <FormControl>
                    <Input placeholder="Ludwigsburg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="objekttyp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objekttyp</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OBJEKTTYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {OBJEKTTYP_LABELS[t]}
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
            name="haltestrategie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Haltestrategie</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HALTESTRATEGIEN.map((h) => (
                      <SelectItem key={h} value={h}>
                        {HALTESTRATEGIE_LABELS[h]}
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
                    {OBJEKT_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {OBJEKT_STATUS_LABELS[s]}
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
            name="baujahr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Baujahr</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1965" {...field} />
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
                  <Input type="number" step="0.01" placeholder="320" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nutzen_lasten_datum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nutzen-Lasten-Wechsel</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notartermin_datum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notartermin</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marktwert_sprengnetter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marktwert Sprengnetter (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marktwert_pricehubble"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marktwert PriceHubble (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                : "Objekt anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
