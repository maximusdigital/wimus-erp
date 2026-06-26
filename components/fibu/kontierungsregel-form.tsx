"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  kontierungsregelFormSchema,
  type KontierungsregelFormValues,
} from "@/lib/validations/kontierungsregel"
import {
  KONTIERUNG_SCOPES,
  KONTIERUNG_SCOPE_LABELS,
  type Kontierungsregel,
} from "@/types/kontierungsregel"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"
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

const KEINE = "__keine__"

export function KontierungsregelForm({
  regel,
  firmen,
}: {
  regel?: Kontierungsregel
  firmen: FirmaOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<KontierungsregelFormValues>({
    resolver: zodResolver(kontierungsregelFormSchema),
    defaultValues: {
      scope: (regel?.scope as KontierungsregelFormValues["scope"]) ?? "workspace",
      firma_id: regel?.firma_id ?? "",
      match: regel?.match ?? "",
      soll_konto: regel?.soll_konto ?? "",
      haben_logik: regel?.haben_logik ?? "",
      ust_satz: regel?.ust_satz != null ? String(regel.ust_satz) : "",
      steuerschluessel: regel?.steuerschluessel ?? "",
      prioritaet: regel?.prioritaet != null ? String(regel.prioritaet) : "100",
    },
  })

  async function onSubmit(values: KontierungsregelFormValues) {
    setError(null)
    const url = regel
      ? `/api/fibu/kontierungsregeln/${regel.id}`
      : "/api/fibu/kontierungsregeln"
    const res = await fetch(url, {
      method: regel ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        firma_id: values.firma_id === KEINE ? "" : values.firma_id,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    router.push("/fibu/kontierungsregeln")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex max-w-[720px] flex-col gap-4"
      >
        {error ? (
          <div className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Geltungsbereich <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => KONTIERUNG_SCOPE_LABELS[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KONTIERUNG_SCOPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {KONTIERUNG_SCOPE_LABELS[s]}
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
            name="firma_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma (nur bei Override)</FormLabel>
                <Select
                  value={field.value || KEINE}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) =>
                          !v || v === KEINE
                            ? "Alle (Workspace)"
                            : (firmen.find((f) => f.id === v)?.name ?? "—")
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={KEINE}>Alle (Workspace)</SelectItem>
                    {firmen.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
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
            name="match"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Match (Gewerk/Lieferant) <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. reinigung, strom, versicherung" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="soll_konto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Soll-Konto <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. 4250" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="haben_logik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Haben-Logik</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. k1→bank" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ust_satz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USt-Satz (%)</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="decimal" placeholder="19" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="steuerschluessel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Steuerschlüssel (DATEV)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. 9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioritaet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorität (kleiner = zuerst)</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" placeholder="100" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/fibu/kontierungsregeln")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {regel ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
