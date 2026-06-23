"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  vertragFormSchema,
  type VertragFormValues,
} from "@/lib/validations/vertrag"
import {
  VERTRAGSARTEN,
  VERTRAGSART_LABELS,
  VERTRAG_STATUS,
  VERTRAG_STATUS_LABELS,
  type EinheitRef,
  type KontaktRef,
  type ObjektRef,
  type Vertrag,
} from "@/types/vertrag"
import { kontaktName } from "@/types/kontakt"
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

function emptyValues(prefill?: {
  objektId?: string
  einheitId?: string
  mieterId?: string
}): VertragFormValues {
  return {
    vertragsnummer: "",
    vertragsart: "",
    status: "entwurf",
    objekt_id: prefill?.objektId ?? "",
    einheit_id: prefill?.einheitId ?? "",
    mieter_id: prefill?.mieterId ?? "",
    beginn: "",
    ende: "",
    unbefristet: "ja",
    grundmiete: "",
    bk_pauschale: "",
    heizkosten_pauschale: "",
    strompauschale: "",
    faelligkeitsregel: "",
  }
}

function toFormValues(v: Vertrag): VertragFormValues {
  const s = (x: string | null) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    vertragsnummer: s(v.vertragsnummer),
    vertragsart: s(v.vertragsart),
    status: v.status as VertragFormValues["status"],
    objekt_id: s(v.objekt_id),
    einheit_id: s(v.einheit_id),
    mieter_id: s(v.mieter_id),
    beginn: d(v.beginn),
    ende: d(v.ende),
    unbefristet: v.unbefristet ? "ja" : "nein",
    grundmiete: n(v.grundmiete),
    bk_pauschale: n(v.bk_pauschale),
    heizkosten_pauschale: n(v.heizkosten_pauschale),
    strompauschale: n(v.strompauschale),
    faelligkeitsregel: s(v.faelligkeitsregel),
  }
}

export function VertragForm({
  vertrag,
  objekte,
  einheiten,
  kontakte,
  defaultObjektId,
  defaultEinheitId,
  defaultMieterId,
}: {
  vertrag?: Vertrag
  objekte: ObjektRef[]
  einheiten: EinheitRef[]
  kontakte: KontaktRef[]
  defaultObjektId?: string
  defaultEinheitId?: string
  defaultMieterId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(vertrag)
  const [serverError, setServerError] = useState<string | null>(null)

  // Objekt aus der vorausgewählten Einheit ableiten, damit der Einheiten-Filter passt.
  const einheitObjektId = defaultEinheitId
    ? einheiten.find((e) => e.id === defaultEinheitId)?.objekt_id
    : undefined

  const form = useForm<VertragFormValues>({
    resolver: zodResolver(vertragFormSchema),
    defaultValues: vertrag
      ? toFormValues(vertrag)
      : emptyValues({
          objektId: defaultObjektId ?? einheitObjektId,
          einheitId: defaultEinheitId,
          mieterId: defaultMieterId,
        }),
  })

  const selectedObjekt = form.watch("objekt_id")
  const einheitOptionen = selectedObjekt
    ? einheiten.filter((e) => e.objekt_id === selectedObjekt)
    : einheiten

  async function onSubmit(values: VertragFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/vertraege/${vertrag!.id}` : "/api/vertraege",
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
      isEdit ? `/vertraege/${vertrag!.id}` : `/vertraege/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="vertragsnummer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertragsnummer</FormLabel>
                <FormControl>
                  <Input placeholder="2021-BHS16-W3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vertragsart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertragsart</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VERTRAGSARTEN.map((a) => (
                      <SelectItem key={a} value={a}>
                        {VERTRAGSART_LABELS[a]}
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
                    {VERTRAG_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {VERTRAG_STATUS_LABELS[s]}
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
            name="objekt_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objekt</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    // Einheit zurücksetzen, wenn sie nicht zum Objekt passt.
                    const cur = form.getValues("einheit_id")
                    if (cur && !einheiten.some((e) => e.id === cur && e.objekt_id === v)) {
                      form.setValue("einheit_id", "")
                    }
                  }}
                >
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
            name="einheit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Einheit</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Einheit wählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {einheitOptionen.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.verwendungszweck_code ?? e.bezeichnung ?? "Einheit"}
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
            name="beginn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beginn</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ende"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ende</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unbefristet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unbefristet</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ja">Ja</SelectItem>
                    <SelectItem value="nein">Nein</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grundmiete"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grundmiete (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="780" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bk_pauschale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BK-Pauschale (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="120" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heizkosten_pauschale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heizkosten-Pauschale (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strompauschale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strompauschale (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faelligkeitsregel"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-1">
                <FormLabel>Fälligkeitsregel</FormLabel>
                <FormControl>
                  <Input placeholder="3. Werktag des Monats" {...field} />
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
                : "Vertrag anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
