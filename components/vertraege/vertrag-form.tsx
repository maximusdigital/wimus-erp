"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { BelegungHinweis } from "@/components/belegung/belegung-hinweis"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  vertragFormSchema,
  type VertragFormValues,
} from "@/lib/validations/vertrag"
import {
  VERTRAGSTYPEN,
  VERTRAGSTYP_LABELS,
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
  einheitId?: string
  mieterId?: string
}): VertragFormValues {
  return {
    vertragstyp: "",
    status: "entwurf",
    einheit_id: prefill?.einheitId ?? "",
    mieter_id: prefill?.mieterId ?? "",
    mietbeginn: "",
    mietende: "",
    kdu_relevant: "nein",
    grundmiete: "",
    bk_pauschale: "",
    heizkosten_pauschale: "",
    strompauschale: "",
    faelligkeitsregel: "",
  }
}

function toFormValues(v: Vertrag): VertragFormValues {
  const s = (x: string | null | undefined) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    vertragstyp: s(v.vertragstyp),
    status: v.status as VertragFormValues["status"],
    einheit_id: s(v.einheit_id),
    mieter_id: s(v.mieter_id),
    mietbeginn: d(v.mietbeginn),
    mietende: d(v.mietende),
    kdu_relevant: v.kdu_relevant ? "ja" : "nein",
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

  const form = useForm<VertragFormValues>({
    resolver: zodResolver(vertragFormSchema),
    defaultValues: vertrag
      ? toFormValues(vertrag)
      : emptyValues({
          einheitId: defaultEinheitId,
          mieterId: defaultMieterId,
        }),
  })

  const watchEinheitId = form.watch("einheit_id")
  const watchMietbeginn = form.watch("mietbeginn")
  const watchMietende = form.watch("mietende")

  // mietvertraege speichert nur einheit_id; das Objekt dient hier nur als Filter,
  // um die Einheiten-Auswahl einzugrenzen (lokaler State, kein Formularfeld).
  const einheitObjektId = (id: string | undefined) =>
    id ? einheiten.find((e) => e.id === id)?.objekt_id ?? "" : ""
  const [objektFilter, setObjektFilter] = useState<string>(
    () =>
      defaultObjektId ??
      einheitObjektId(vertrag?.einheit_id ?? defaultEinheitId) ??
      ""
  )

  const einheitOptionen = objektFilter
    ? einheiten.filter((e) => e.objekt_id === objektFilter)
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
            name="vertragstyp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertragstyp</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VERTRAGSTYPEN.map((a) => (
                      <SelectItem key={a} value={a}>
                        {VERTRAGSTYP_LABELS[a]}
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

          {/* Objekt ist kein Vertragsfeld – nur Filter für die Einheiten-Auswahl. */}
          <FormItem>
            <FormLabel>Objekt (Filter)</FormLabel>
            <Select
              value={objektFilter}
              onValueChange={(v) => {
                const next = v ?? ""
                setObjektFilter(next)
                // Einheit zurücksetzen, wenn sie nicht zum Objekt passt.
                const cur = form.getValues("einheit_id")
                if (cur && !einheiten.some((e) => e.id === cur && e.objekt_id === next)) {
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

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
            name="mietbeginn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mietbeginn</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mietende"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mietende</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="sm:col-span-2">
            <BelegungHinweis
              einheitId={watchEinheitId}
              von={watchMietbeginn || null}
              bis={watchMietende || null}
            />
          </div>

          <FormField
            control={form.control}
            name="kdu_relevant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KdU-relevant</FormLabel>
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
