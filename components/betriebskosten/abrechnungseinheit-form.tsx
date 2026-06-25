"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  abrechnungseinheitFormSchema,
  type AbrechnungseinheitFormValues,
} from "@/lib/validations/abrechnungseinheit"
import { BK_SCHLUESSEL, BK_SCHLUESSEL_LABELS } from "@/types/bk-art"
import type { Abrechnungseinheit } from "@/types/betriebskosten"
import type { ObjektOption } from "@/lib/betriebskosten-options"
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

const NONE = "__none__"

function emptyValues(prefill?: {
  objektId?: string
}): AbrechnungseinheitFormValues {
  return {
    objekt_id: prefill?.objektId ?? "",
    bezeichnung: "",
    typ: "",
    standard_schluessel: "",
    aktiv: "ja",
  }
}

function toFormValues(a: Abrechnungseinheit): AbrechnungseinheitFormValues {
  return {
    objekt_id: a.objekt_id ?? "",
    bezeichnung: a.bezeichnung ?? "",
    typ: a.typ ?? "",
    standard_schluessel: a.standard_schluessel ?? "",
    aktiv: a.aktiv === false ? "nein" : "ja",
  }
}

export function AbrechnungseinheitForm({
  abrechnungseinheit,
  objekte,
  defaultObjektId,
}: {
  abrechnungseinheit?: Abrechnungseinheit
  objekte: ObjektOption[]
  defaultObjektId?: string
}) {
  const router = useRouter()
  const isEdit = Boolean(abrechnungseinheit)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AbrechnungseinheitFormValues>({
    resolver: zodResolver(abrechnungseinheitFormSchema),
    defaultValues: abrechnungseinheit
      ? toFormValues(abrechnungseinheit)
      : emptyValues({ objektId: defaultObjektId }),
  })

  async function onSubmit(values: AbrechnungseinheitFormValues) {
    setServerError(null)
    const res = await fetch(
      isEdit
        ? `/api/abrechnungseinheiten/${abrechnungseinheit!.id}`
        : "/api/abrechnungseinheiten",
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
      isEdit
        ? `/betriebskosten/${abrechnungseinheit!.id}`
        : `/betriebskosten/${saved?.id ?? ""}`
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
              <FormItem>
                <FormLabel>
                  Objekt <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
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
            name="bezeichnung"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Bezeichnung <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="z. B. Gebäude A" {...field} />
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
                <FormControl>
                  <Input placeholder="z. B. Wirtschaftseinheit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="standard_schluessel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard-Umlageschlüssel</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keiner —">
                        {(v) =>
                          v && v !== NONE
                            ? (BK_SCHLUESSEL_LABELS[v] ?? v)
                            : "— keiner —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keiner —</SelectItem>
                    {BK_SCHLUESSEL.map((s) => (
                      <SelectItem key={s} value={s}>
                        {BK_SCHLUESSEL_LABELS[s]}
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
                : "Abrechnungseinheit anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
