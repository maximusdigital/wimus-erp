"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  vorgangFormSchema,
  type VorgangFormValues,
} from "@/lib/validations/vorgang"
import {
  VORGANG_KOSTENTRAEGER,
  VORGANG_KOSTENTRAEGER_LABELS,
  VORGANG_PRIORITAET,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_STATUS,
  VORGANG_STATUS_LABELS,
  VORGANG_TYPEN,
  VORGANG_TYP_LABELS,
  type EinheitRef,
  type ObjektRef,
  type Vorgang,
} from "@/types/vorgang"
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

function emptyValues(prefill?: {
  objektId?: string
  einheitId?: string
}): VorgangFormValues {
  return {
    titel: "",
    beschreibung: "",
    objekt_id: prefill?.objektId ?? "",
    einheit_id: prefill?.einheitId ?? "",
    typ: "",
    prioritaet: "normal",
    kostentraeger: "",
    faellig_am: "",
    status: "offen",
  }
}

function toFormValues(v: Vorgang): VorgangFormValues {
  const s = (x: string | null) => x ?? ""
  const d = (x: string | null) => (x ? x.slice(0, 10) : "")
  return {
    titel: v.titel,
    beschreibung: s(v.beschreibung),
    objekt_id: s(v.objekt_id),
    einheit_id: s(v.einheit_id),
    typ: s(v.typ),
    prioritaet: v.prioritaet as VorgangFormValues["prioritaet"],
    kostentraeger: s(v.kostentraeger),
    faellig_am: d(v.faellig_am),
    status: v.status as VorgangFormValues["status"],
  }
}

export function VorgangForm({
  vorgang,
  objekte,
  einheiten,
  defaultObjektId,
  defaultEinheitId,
}: {
  vorgang?: Vorgang
  objekte: ObjektRef[]
  einheiten: EinheitRef[]
  defaultObjektId?: string
  defaultEinheitId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(vorgang)
  const [serverError, setServerError] = useState<string | null>(null)

  // Objekt aus der vorausgewählten Einheit ableiten, damit der Einheiten-Filter passt.
  const einheitObjektId = defaultEinheitId
    ? einheiten.find((e) => e.id === defaultEinheitId)?.objekt_id
    : undefined

  const form = useForm<VorgangFormValues>({
    resolver: zodResolver(vorgangFormSchema),
    defaultValues: vorgang
      ? toFormValues(vorgang)
      : emptyValues({
          objektId: defaultObjektId ?? einheitObjektId,
          einheitId: defaultEinheitId,
        }),
  })

  const selectedObjekt = form.watch("objekt_id")
  const einheitOptionen = selectedObjekt
    ? einheiten.filter((e) => e.objekt_id === selectedObjekt)
    : einheiten

  async function onSubmit(values: VorgangFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit ? `/api/vorgaenge/${vorgang!.id}` : "/api/vorgaenge",
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
      isEdit ? `/vorgaenge/${vorgang!.id}` : `/vorgaenge/${saved?.id ?? ""}`
    )
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="titel"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-3">
                <FormLabel>Titel *</FormLabel>
                <FormControl>
                  <Input placeholder="Heizung defekt – BHS16 W3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="beschreibung"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-3">
                <FormLabel>Beschreibung</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Details zum Vorgang…"
                    rows={4}
                    {...field}
                  />
                </FormControl>
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
                    {VORGANG_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {VORGANG_TYP_LABELS[t]}
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
            name="prioritaet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorität *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VORGANG_PRIORITAET.map((p) => (
                      <SelectItem key={p} value={p}>
                        {VORGANG_PRIORITAET_LABELS[p]}
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
            name="kostentraeger"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kostenträger</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VORGANG_KOSTENTRAEGER.map((k) => (
                      <SelectItem key={k} value={k}>
                        {VORGANG_KOSTENTRAEGER_LABELS[k]}
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
            name="faellig_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fällig am</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                    {VORGANG_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {VORGANG_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                : "Vorgang anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
