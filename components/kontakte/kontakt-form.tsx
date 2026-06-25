"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  kontaktFormSchema,
  type KontaktFormValues,
} from "@/lib/validations/kontakt"
import {
  ANREDEN,
  KONTAKT_TYP,
  KONTAKT_TYP_LABELS,
  ROLLEN,
  SPRACHEN,
  SPRACHE_LABELS,
  type Kontakt,
  type RollenKey,
} from "@/types/kontakt"
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

const EMPTY_VALUES: KontaktFormValues = {
  kontakt_typ: "person",
  anrede: "",
  vorname: "",
  nachname: "",
  firmenname: "",
  rechtsform: "",
  email: "",
  telefon_mobil: "",
  telefon_festnetz: "",
  strasse: "",
  hausnummer: "",
  plz: "",
  stadt: "",
  land: "",
  iban: "",
  bic: "",
  debitor_nr: "",
  kreditor_nr: "",
  zahlungsziel_tage: "",
  sprache: "de",
  ist_mieter: false,
  ist_eigentuemer: false,
  ist_dienstleister: false,
  ist_makler: false,
  ist_tippgeber: false,
  ist_bank: false,
  dsgvo_datenweitergabe: "nein",
  aktiv: "ja",
}

function toFormValues(k: Kontakt): KontaktFormValues {
  const s = (v: string | null) => v ?? ""
  return {
    kontakt_typ: (k.kontakt_typ as KontaktFormValues["kontakt_typ"]) ?? "person",
    anrede: s(k.anrede),
    vorname: s(k.vorname),
    nachname: s(k.nachname),
    firmenname: s(k.firmenname),
    rechtsform: s(k.rechtsform),
    email: s(k.email),
    telefon_mobil: s(k.telefon_mobil),
    telefon_festnetz: s(k.telefon_festnetz),
    strasse: s(k.strasse),
    hausnummer: s(k.hausnummer),
    plz: s(k.plz),
    stadt: s(k.stadt),
    land: s(k.land),
    iban: s(k.iban),
    bic: s(k.bic),
    debitor_nr: s(k.debitor_nr),
    kreditor_nr: s(k.kreditor_nr),
    zahlungsziel_tage:
      k.zahlungsziel_tage != null ? String(k.zahlungsziel_tage) : "",
    sprache: (k.sprache as KontaktFormValues["sprache"]) ?? "de",
    ist_mieter: !!k.ist_mieter,
    ist_eigentuemer: !!k.ist_eigentuemer,
    ist_dienstleister: !!k.ist_dienstleister,
    ist_makler: !!k.ist_makler,
    ist_tippgeber: !!k.ist_tippgeber,
    ist_bank: !!k.ist_bank,
    dsgvo_datenweitergabe: k.dsgvo_datenweitergabe ? "ja" : "nein",
    aktiv: k.aktiv === false ? "nein" : "ja",
  }
}

export function KontaktForm({
  kontakt,
  vertraege = [],
  selectedVertragIds = [],
}: {
  kontakt?: Kontakt
  vertraege?: MultiSelectOption[]
  selectedVertragIds?: string[]
}) {
  const router = useRouter()
  const isEdit = Boolean(kontakt)
  const [serverError, setServerError] = useState<string | null>(null)
  const [vertragIds, setVertragIds] = useState<string[]>(selectedVertragIds)

  const form = useForm<KontaktFormValues>({
    resolver: zodResolver(kontaktFormSchema),
    defaultValues: kontakt ? toFormValues(kontakt) : EMPTY_VALUES,
  })

  const kontaktTyp = form.watch("kontakt_typ")

  async function onSubmit(values: KontaktFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/kontakte/${kontakt!.id}` : "/api/kontakte",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, vertrag_ids: vertragIds }),
      }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setServerError(body?.error ?? "Speichern fehlgeschlagen.")
      return
    }

    const saved = await res.json().catch(() => null)
    router.push(
      isEdit ? `/kontakte/${kontakt!.id}` : `/kontakte/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Person / Firma Toggle */}
        <FormField
          control={form.control}
          name="kontakt_typ"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kontakttyp *</FormLabel>
              <div className="flex gap-2">
                {KONTAKT_TYP.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={field.value === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => field.onChange(t)}
                  >
                    {KONTAKT_TYP_LABELS[t]}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rollen-Checkboxen */}
        <FormItem>
          <FormLabel>Rollen</FormLabel>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {ROLLEN.map((r) => (
              <FormField
                key={r.key}
                control={form.control}
                name={r.key as RollenKey}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    {r.label}
                  </label>
                )}
              />
            ))}
          </div>
        </FormItem>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kontaktTyp === "person" ? (
            <>
              <FormField
                control={form.control}
                name="anrede"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anrede</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Auswählen…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ANREDEN.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
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
                name="vorname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input placeholder="Thomas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nachname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachname</FormLabel>
                    <FormControl>
                      <Input placeholder="Becker" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <>
              <FormField
                control={form.control}
                name="firmenname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname</FormLabel>
                    <FormControl>
                      <Input placeholder="Müller Sanitär GmbH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rechtsform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rechtsform</FormLabel>
                    <FormControl>
                      <Input placeholder="GmbH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefon_mobil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon (mobil)</FormLabel>
                <FormControl>
                  <Input placeholder="+49 170 1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefon_festnetz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon (Festnetz)</FormLabel>
                <FormControl>
                  <Input placeholder="+49 711 1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Adresse als Block */}
        <div className="space-y-2">
          <FormLabel>Adresse</FormLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="strasse"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
                  <FormControl>
                    <Input placeholder="Nr." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plz"
              render={({ field }) => (
                <FormItem>
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
                <FormItem className="sm:col-span-2">
                  <FormControl>
                    <Input placeholder="Ludwigsburg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="land"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormControl>
                    <Input placeholder="Deutschland" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Bank / Buchhaltung */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input placeholder="DE…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BIC</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zahlungsziel_tage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zahlungsziel (Tage)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="14" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="debitor_nr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Debitor-Nr.</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kreditor_nr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kreditor-Nr.</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sprache"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sprache</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => (v ? (SPRACHE_LABELS[v] ?? v) : "Auswählen…")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SPRACHEN.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SPRACHE_LABELS[s]}
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
            name="dsgvo_datenweitergabe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DSGVO-Datenweitergabe</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nein">Nein</SelectItem>
                    <SelectItem value="ja">Ja</SelectItem>
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
                <FormLabel>Status</FormLabel>
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

        {vertraege.length > 0 ? (
          <ZuordnungFeld
            label="Verträge zuordnen"
            options={vertraege}
            value={vertragIds}
            onChange={setVertragIds}
            emptyText="Keine Verträge vorhanden."
            beschreibung="Verträge, bei denen dieser Kontakt Mieter ist. Abwählen löst die Zuordnung."
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
                : "Kontakt anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
