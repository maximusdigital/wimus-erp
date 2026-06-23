"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  assetFormSchema,
  type AssetFormValues,
} from "@/lib/validations/asset"
import {
  ASSET_STANDORT_TYP,
  ASSET_STANDORT_TYP_LABELS,
  ASSET_TYPEN,
  ASSET_TYP_LABELS,
  ASSET_ZUSTAND,
  ASSET_ZUSTAND_LABELS,
  type Asset,
  type EinheitRef,
  type ObjektRef,
} from "@/types/asset"
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
}): AssetFormValues {
  return {
    bezeichnung: "",
    typ: "",
    asset_code: "",
    zustand: "",
    standort_typ: "",
    objekt_id: prefill?.objektId ?? "",
    einheit_id: prefill?.einheitId ?? "",
    anschaffung_am: "",
    anschaffung_wert: "",
  }
}

function toFormValues(a: Asset): AssetFormValues {
  const s = (x: string | null) => x ?? ""
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    bezeichnung: a.bezeichnung,
    typ: s(a.typ),
    asset_code: s(a.asset_code),
    zustand: s(a.zustand),
    standort_typ: s(a.standort_typ),
    objekt_id: s(a.objekt_id),
    einheit_id: s(a.einheit_id),
    anschaffung_am: d(a.anschaffung_am),
    anschaffung_wert: a.anschaffung_wert != null ? String(a.anschaffung_wert) : "",
  }
}

export function AssetForm({
  asset,
  objekte,
  einheiten,
  defaultObjektId,
  defaultEinheitId,
}: {
  asset?: Asset
  objekte: ObjektRef[]
  einheiten: EinheitRef[]
  defaultObjektId?: string
  defaultEinheitId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(asset)
  const [serverError, setServerError] = useState<string | null>(null)

  // Objekt aus der vorausgewählten Einheit ableiten, damit der Einheiten-Filter passt.
  const einheitObjektId = defaultEinheitId
    ? einheiten.find((e) => e.id === defaultEinheitId)?.objekt_id
    : undefined

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset
      ? toFormValues(asset)
      : emptyValues({
          objektId: defaultObjektId ?? einheitObjektId,
          einheitId: defaultEinheitId,
        }),
  })

  const selectedObjekt = form.watch("objekt_id")
  const einheitOptionen = selectedObjekt
    ? einheiten.filter((e) => e.objekt_id === selectedObjekt)
    : einheiten

  async function onSubmit(values: AssetFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/assets/${asset!.id}` : "/api/assets",
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
      isEdit ? `/inventar/${asset!.id}` : `/inventar/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="bezeichnung"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-3">
                <FormLabel>Bezeichnung *</FormLabel>
                <FormControl>
                  <Input placeholder="Waschmaschine Bosch WAN28" {...field} />
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
                <FormLabel>Typ</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ASSET_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ASSET_TYP_LABELS[t]}
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
            name="asset_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset-Code</FormLabel>
                <FormControl>
                  <Input placeholder="INV-0001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zustand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zustand</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ASSET_ZUSTAND.map((z) => (
                      <SelectItem key={z} value={z}>
                        {ASSET_ZUSTAND_LABELS[z]}
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
            name="standort_typ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standort</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ASSET_STANDORT_TYP.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ASSET_STANDORT_TYP_LABELS[s]}
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
                    if (
                      cur &&
                      !einheiten.some((e) => e.id === cur && e.objekt_id === v)
                    ) {
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
                        {e.label}
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
            name="anschaffung_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anschaffung am</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anschaffung_wert"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anschaffungswert (EUR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...field}
                  />
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
                : "Asset anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
