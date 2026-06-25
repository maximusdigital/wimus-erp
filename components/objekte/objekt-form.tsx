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
import { ZuordnungFeld } from "@/components/shared/zuordnung-feld"
import type { MultiSelectOption } from "@/components/shared/multi-select-list"

/** Einheit-Kurzinfo zur Zuordnung im Objekt-Formular. */
export type EinheitZuordnung = {
  id: string
  objekt_id: string | null
  label: string
  objektKuerzel: string | null
}

const EMPTY_VALUES: ObjektFormValues = {
  kuerzel: "",
  strasse: "",
  hausnummer: "",
  plz: "",
  stadt: "",
  typ: "",
  haltestrategie: "",
  status: "ist",
  baujahr: "",
  marktwert_sprengnetter: "",
  marktwert_pricehubble: "",
  nutzen_lasten_datum: "",
  notartermin_datum: "",
}

function toFormValues(o: Objekt): ObjektFormValues {
  const s = (v: string | null) => v ?? ""
  const n = (v: number | null) => (v == null ? "" : String(v))
  const d = (v: string | null) => (v ? v.slice(0, 10) : "")
  return {
    kuerzel: o.kuerzel,
    strasse: s(o.strasse),
    hausnummer: s(o.hausnummer),
    plz: s(o.plz),
    stadt: s(o.stadt),
    typ: s(o.typ),
    haltestrategie: s(o.haltestrategie),
    status: o.status as ObjektFormValues["status"],
    baujahr: n(o.baujahr),
    marktwert_sprengnetter: n(o.marktwert_sprengnetter),
    marktwert_pricehubble: n(o.marktwert_pricehubble),
    nutzen_lasten_datum: d(o.nutzen_lasten_datum),
    notartermin_datum: d(o.notartermin_datum),
  }
}

export function ObjektForm({
  objekt,
  einheiten = [],
  vertraege = [],
  selectedVertragIds = [],
}: {
  objekt?: Objekt
  einheiten?: EinheitZuordnung[]
  vertraege?: MultiSelectOption[]
  selectedVertragIds?: string[]
}) {
  const router = useRouter()
  const isEdit = Boolean(objekt)
  const [serverError, setServerError] = useState<string | null>(null)
  const [vertragIds, setVertragIds] = useState<string[]>(selectedVertragIds)

  // Aktuell diesem Objekt zugeordnete Einheiten sind vorausgewählt und gesperrt
  // (objekt_id ist Pflicht – Abwählen würde die Einheit verwaisen lassen; das
  // Umhängen erfolgt über die Einheit selbst bzw. über ein anderes Objekt).
  const lockedIds = objekt
    ? einheiten.filter((e) => e.objekt_id === objekt.id).map((e) => e.id)
    : []
  const [einheitIds, setEinheitIds] = useState<string[]>(lockedIds)

  const einheitOptionen: MultiSelectOption[] = einheiten.map((e) => {
    const locked = lockedIds.includes(e.id)
    const fremd =
      !locked && e.objekt_id && e.objektKuerzel
        ? `aktuell: ${e.objektKuerzel}`
        : undefined
    return { value: e.id, label: e.label, hint: fremd, locked }
  })

  const form = useForm<ObjektFormValues>({
    resolver: zodResolver(objektFormSchema),
    defaultValues: objekt ? toFormValues(objekt) : EMPTY_VALUES,
  })

  async function onSubmit(values: ObjektFormValues) {
    setServerError(null)
    // Gesperrte (bereits zugeordnete) immer mitsenden + neu gewählte.
    const einheit_ids = Array.from(new Set([...lockedIds, ...einheitIds]))
    const res = await fetch(
      isEdit ? `/api/objekte/${objekt!.id}` : "/api/objekte",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, einheit_ids, vertrag_ids: vertragIds }),
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
              name="stadt"
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
            name="typ"
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

        {einheiten.length > 0 ? (
          <ZuordnungFeld
            label="Einheiten zuordnen"
            options={einheitOptionen}
            value={einheitIds}
            onChange={setEinheitIds}
            emptyText="Keine Einheiten vorhanden."
            beschreibung="Ausgewählte Einheiten werden diesem Objekt zugeordnet (ggf. von einem anderen Objekt hierher verschoben). Bereits zugeordnete Einheiten sind gesperrt – zum Lösen die Einheit einem anderen Objekt zuweisen."
          />
        ) : null}

        {vertraege.length > 0 ? (
          <ZuordnungFeld
            label="Verträge zuordnen"
            options={vertraege}
            value={vertragIds}
            onChange={setVertragIds}
            emptyText="Keine Verträge vorhanden."
            beschreibung="Welche Verträge gehören zu diesem Objekt. Abwählen löst die Zuordnung."
          />
        ) : null}

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
