"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  kostenpositionFormSchema,
  type KostenpositionFormValues,
} from "@/lib/validations/kostenposition"
import type { Kostenposition } from "@/types/betriebskosten"
import type {
  AbrechnungseinheitOption,
  BkArtOption,
  ObjektOption,
} from "@/lib/betriebskosten-options"
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

const NONE = "__none__"

function emptyValues(): KostenpositionFormValues {
  return {
    objekt_id: "",
    bk_art_id: "",
    abrechnungseinheit_id: "",
    betrag_brutto: "",
    leistung_von: "",
    leistung_bis: "",
    umlagefaehig: "ja",
    abrechnungsperiode: String(new Date().getFullYear() - 1),
    notiz: "",
  }
}

function toFormValues(p: Kostenposition): KostenpositionFormValues {
  const s = (x: string | null) => x ?? ""
  const n = (x: number | null) => (x == null ? "" : String(x))
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    objekt_id: s(p.objekt_id),
    bk_art_id: s(p.bk_art_id),
    abrechnungseinheit_id: s(p.abrechnungseinheit_id),
    betrag_brutto: n(p.betrag_brutto),
    leistung_von: d(p.leistung_von),
    leistung_bis: d(p.leistung_bis),
    umlagefaehig: p.umlagefaehig === false ? "nein" : "ja",
    abrechnungsperiode: s(p.abrechnungsperiode),
    notiz: s(p.notiz),
  }
}

export function PositionForm({
  position,
  objekte,
  bkArten,
  abrechnungseinheiten,
}: {
  position?: Kostenposition
  objekte: ObjektOption[]
  bkArten: BkArtOption[]
  abrechnungseinheiten: AbrechnungseinheitOption[]
}) {
  const router = useRouter()
  const isEdit = Boolean(position)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<KostenpositionFormValues>({
    resolver: zodResolver(kostenpositionFormSchema),
    defaultValues: position ? toFormValues(position) : emptyValues(),
  })

  const objektId = form.watch("objekt_id")
  // Abrechnungseinheiten auf das gewählte Objekt einschränken.
  const aeOptionen = objektId
    ? abrechnungseinheiten.filter((a) => a.objekt_id === objektId)
    : abrechnungseinheiten

  async function onSubmit(values: KostenpositionFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/kostenpositionen/${position!.id}` : "/api/kostenpositionen",
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

    router.push("/betriebskosten/positionen")
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
              <FormItem>
                <FormLabel>
                  Objekt <span className="text-danger">*</span>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    // AE-Auswahl zurücksetzen, falls Objekt nicht mehr passt.
                    const cur = form.getValues("abrechnungseinheit_id")
                    if (
                      cur &&
                      !abrechnungseinheiten.some(
                        (a) => a.id === cur && a.objekt_id === v
                      )
                    ) {
                      form.setValue("abrechnungseinheit_id", "")
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Objekt wählen…">
                        {(v) =>
                          objekte.find((x) => x.id === v)?.label ??
                          "Objekt wählen…"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {objekte.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
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
            name="bk_art_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Kostenart <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kostenart wählen…">
                        {(v) =>
                          bkArten.find((x) => x.id === v)?.label ??
                          "Kostenart wählen…"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bkArten.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label}
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
            name="abrechnungseinheit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abrechnungseinheit</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keine —">
                        {(v) =>
                          v && v !== NONE
                            ? (abrechnungseinheiten.find((x) => x.id === v)
                                ?.label ?? "— keine —")
                            : "— keine —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keine —</SelectItem>
                    {aeOptionen.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
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
            name="betrag_brutto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Betrag brutto (€) <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="abrechnungsperiode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abrechnungsperiode</FormLabel>
                <FormControl>
                  <Input placeholder="z. B. 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="umlagefaehig"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Umlagefähig</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => (v === "nein" ? "Nein" : "Ja")}
                      </SelectValue>
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
            name="leistung_von"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leistung von</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="leistung_bis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leistung bis</FormLabel>
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
                : "Kostenposition anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
