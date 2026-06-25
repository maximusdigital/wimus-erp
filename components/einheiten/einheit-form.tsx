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
import { ZuordnungFeld } from "@/components/shared/zuordnung-feld"
import type { MultiSelectOption } from "@/components/shared/multi-select-list"

function emptyValues(objektId?: string): EinheitFormValues {
  return {
    objekt_id: objektId ?? "",
    kuerzel: "",
    bezeichnung: "",
    lage: "",
    verwendungszweck_code: "",
    typ: "",
    aktiv: "ja",
    flaeche: "",
    zimmer: "",
    schlafzimmer: "",
    baeder: "",
    etage_beschreibung: "",
    keybox_pin_statisch: "",
    keybox_standort: "",
    max_personen: "",
    anleitung_url: "",
    gaestemappe_url_slug: "",
  }
}

function toFormValues(e: Einheit): EinheitFormValues {
  const s = (v: string | null) => v ?? ""
  const n = (v: number | null) => (v == null ? "" : String(v))
  return {
    objekt_id: e.objekt_id,
    kuerzel: s(e.kuerzel),
    bezeichnung: s(e.bezeichnung),
    lage: s(e.lage),
    verwendungszweck_code: s(e.verwendungszweck_code),
    typ: s(e.typ),
    aktiv: e.aktiv === false ? "nein" : "ja",
    flaeche: n(e.flaeche),
    zimmer: n(e.zimmer),
    schlafzimmer: n(e.schlafzimmer),
    baeder: n(e.baeder),
    etage_beschreibung: s(e.etage_beschreibung),
    keybox_pin_statisch: s(e.keybox_pin_statisch),
    keybox_standort: s(e.keybox_standort),
    max_personen: n(e.max_personen),
    anleitung_url: s(e.anleitung_url),
    gaestemappe_url_slug: s(e.gaestemappe_url_slug),
  }
}

export function EinheitForm({
  einheit,
  objekte,
  defaultObjektId,
  vertraege = [],
  selectedVertragIds = [],
}: {
  einheit?: Einheit
  objekte: ObjektOption[]
  defaultObjektId?: string
  vertraege?: MultiSelectOption[]
  selectedVertragIds?: string[]
}) {
  const router = useRouter()
  const isEdit = Boolean(einheit)
  const [serverError, setServerError] = useState<string | null>(null)
  const [vertragIds, setVertragIds] = useState<string[]>(selectedVertragIds)

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
        body: JSON.stringify({ ...values, vertrag_ids: vertragIds }),
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
            name="kuerzel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kürzel</FormLabel>
                <FormControl>
                  <Input placeholder="W3" {...field} />
                </FormControl>
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
            name="typ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Einheitstyp</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…">
                        {(v) =>
                          v ? (EINHEITSTYP_LABELS[v] ?? v) : "Auswählen…"
                        }
                      </SelectValue>
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
            name="etage_beschreibung"
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
            name="flaeche"
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
            name="zimmer"
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

          <FormField
            control={form.control}
            name="schlafzimmer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schlafzimmer</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="baeder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bäder</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Keybox &amp; KZV</h3>
            <p className="text-muted-foreground text-xs">
              Statischer Hauszugang. Der Keybox-PIN wird je Buchung übernommen
              (≠ dynamischer Apartment-PIN).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="keybox_pin_statisch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keybox-PIN (statisch)</FormLabel>
                  <FormControl>
                    <Input placeholder="2606" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keybox_standort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keybox-Standort</FormLabel>
                  <FormControl>
                    <Input placeholder="links neben Eingangstür" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_personen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max. Personen</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="anleitung_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anleitung-URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gaestemappe_url_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gästemappe-Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="bhs16-w3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {vertraege.length > 0 ? (
          <ZuordnungFeld
            label="Verträge zuordnen"
            options={vertraege}
            value={vertragIds}
            onChange={setVertragIds}
            emptyText="Keine Verträge vorhanden."
            beschreibung="Welche Verträge gehören zu dieser Einheit. Abwählen löst die Zuordnung."
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
                : "Einheit anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
