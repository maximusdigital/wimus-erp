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
  KONTAKT_TYPEN,
  KONTAKT_TYP_LABELS,
  type Kontakt,
} from "@/types/kontakt"
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
import { ZuordnungFeld } from "@/components/shared/zuordnung-feld"
import type { MultiSelectOption } from "@/components/shared/multi-select-list"

const EMPTY_VALUES: KontaktFormValues = {
  typ: "mieter",
  anrede: "",
  vorname: "",
  nachname: "",
  firma: "",
  email: "",
  telefon: "",
  strasse: "",
  plz: "",
  ort: "",
  ausweis_nr: "",
  dsgvo_datenweitergabe: "nein",
  dsgvo_einwilligung_am: "",
  notiz: "",
}

function toFormValues(k: Kontakt): KontaktFormValues {
  const s = (v: string | null) => v ?? ""
  const d = (v: string | null) => (v ? v.slice(0, 10) : "")
  return {
    typ: k.typ as KontaktFormValues["typ"],
    anrede: s(k.anrede),
    vorname: s(k.vorname),
    nachname: s(k.nachname),
    firma: s(k.firma),
    email: s(k.email),
    telefon: s(k.telefon),
    strasse: s(k.strasse),
    plz: s(k.plz),
    ort: s(k.ort),
    ausweis_nr: s(k.ausweis_nr),
    dsgvo_datenweitergabe: k.dsgvo_datenweitergabe ? "ja" : "nein",
    dsgvo_einwilligung_am: d(k.dsgvo_einwilligung_am),
    notiz: s(k.notiz),
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="typ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typ *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KONTAKT_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {KONTAKT_TYP_LABELS[t]}
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
            name="firma"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma</FormLabel>
                <FormControl>
                  <Input placeholder="Müller Sanitär GmbH" {...field} />
                </FormControl>
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
            name="telefon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="+49 711 1234567" {...field} />
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
                <FormLabel>Straße & Nr.</FormLabel>
                <FormControl>
                  <Input placeholder="Bauhofstraße 16" {...field} />
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
            name="ausweis_nr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ausweis-Nr.</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
            name="dsgvo_einwilligung_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Einwilligung am</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
