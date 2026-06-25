"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  buchungFormSchema,
  type BuchungFormValues,
} from "@/lib/validations/buchung"
import {
  BUCHUNG_STATUS,
  BUCHUNG_STATUS_LABELS,
  KANAELE,
  KANAL_LABELS,
  naechte,
  type Buchung,
} from "@/types/buchung"
import type { BuchungEinheitOption } from "@/lib/buchung-options"
import type { KontaktRef } from "@/types/vertrag"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

function emptyValues(prefill?: {
  einheitId?: string
  gastId?: string
}): BuchungFormValues {
  return {
    einheit_id: prefill?.einheitId ?? "",
    gast_id: prefill?.gastId ?? "",
    kanal: "",
    beds24_id: "",
    checkin: "",
    checkout: "",
    personen: "",
    betrag_brutto: "",
    ust_prozent: "7",
    apartment_pin: "",
    status: "bestaetigt",
  }
}

/** timestamptz → datetime-local-String (yyyy-MM-ddTHH:mm). */
function toLocalDateTime(x: string | null): string {
  if (!x) return ""
  const d = new Date(x)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

function toFormValues(b: Buchung): BuchungFormValues {
  const s = (x: string | null) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  return {
    einheit_id: s(b.einheit_id),
    gast_id: s(b.gast_id),
    kanal: s(b.kanal),
    beds24_id: s(b.beds24_id),
    checkin: toLocalDateTime(b.checkin),
    checkout: toLocalDateTime(b.checkout),
    personen: n(b.personen),
    betrag_brutto: n(b.betrag_brutto),
    ust_prozent: b.ust_prozent == null ? "7" : String(b.ust_prozent),
    apartment_pin: s(b.apartment_pin),
    status: b.status as BuchungFormValues["status"],
  }
}

export function BuchungForm({
  buchung,
  einheiten,
  kontakte,
  defaultEinheitId,
  defaultGastId,
}: {
  buchung?: Buchung
  einheiten: BuchungEinheitOption[]
  kontakte: KontaktRef[]
  defaultEinheitId?: string
  defaultGastId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(buchung)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<BuchungFormValues>({
    resolver: zodResolver(buchungFormSchema),
    defaultValues: buchung
      ? toFormValues(buchung)
      : emptyValues({ einheitId: defaultEinheitId, gastId: defaultGastId }),
  })

  // Live-Vorschau (nur Anzeige – maßgeblich ist die Serverberechnung).
  const einheitId = form.watch("einheit_id")
  const personen = form.watch("personen")
  const checkin = form.watch("checkin")
  const checkout = form.watch("checkout")

  const gewaehlteEinheit = einheiten.find((e) => e.id === einheitId)
  const naechteVorschau = naechte(checkin || null, checkout || null)
  const personenZahl = personen ? Number(personen) : 0

  async function onSubmit(values: BuchungFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/buchungen/${buchung!.id}` : "/api/buchungen",
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
      isEdit ? `/buchungen/${buchung!.id}` : `/buchungen/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    {einheiten.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Objekt und Keybox-PIN werden aus der Einheit übernommen.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gast_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gast</FormLabel>
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
            name="kanal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kanal</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KANAELE.map((k) => (
                      <SelectItem key={k} value={k}>
                        {KANAL_LABELS[k]}
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
            name="beds24_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beds24-ID</FormLabel>
                <FormControl>
                  <Input placeholder="z. B. 12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="checkin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-in</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="checkout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-out</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personen"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personen</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" placeholder="2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="betrag_brutto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Betrag (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="450" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ust_prozent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USt (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="7" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apartment_pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apartment-PIN</FormLabel>
                <FormControl>
                  <Input placeholder="dynamisch (TTLock)" {...field} />
                </FormControl>
                <FormDescription>
                  Dynamischer Türcode je Buchung (TTLock/Nuki).
                </FormDescription>
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
                    {BUCHUNG_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {BUCHUNG_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Live-Vorschau: abgeleitete Werte (maßgeblich ist die Serverberechnung). */}
        {gewaehlteEinheit ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Vorschau (wird serverseitig berechnet)</p>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-3">
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">Nächte</dt>
                <dd>{naechteVorschau}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">CityTax (geschätzt)</dt>
                <dd>
                  {personenZahl > 0 && naechteVorschau > 0
                    ? "abhängig vom Objekt-Ort – Serverberechnung"
                    : "–"}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-muted-foreground">Keybox-PIN</dt>
                <dd>wird aus der Einheit übernommen</dd>
              </div>
            </dl>
          </div>
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
                : "Buchung anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
