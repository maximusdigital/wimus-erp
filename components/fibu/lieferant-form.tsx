"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  lieferantFormSchema,
  type LieferantFormValues,
} from "@/lib/validations/lieferant"
import type { Lieferant } from "@/types/lieferant"
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

export function LieferantForm({
  lieferant,
  firmen,
}: {
  lieferant?: Lieferant
  firmen: FirmaOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LieferantFormValues>({
    resolver: zodResolver(lieferantFormSchema),
    defaultValues: {
      name: lieferant?.name ?? "",
      alias: lieferant?.alias ? lieferant.alias.join(", ") : "",
      ustid: lieferant?.ustid ?? "",
      iban: lieferant?.iban ?? "",
      standard_gewerk: lieferant?.standard_gewerk ?? "",
      standard_konto: lieferant?.standard_konto ?? "",
      firma_id: lieferant?.firma_id ?? "",
    },
  })

  async function onSubmit(values: LieferantFormValues) {
    setError(null)
    const url = lieferant
      ? `/api/fibu/lieferanten/${lieferant.id}`
      : "/api/fibu/lieferanten"
    const res = await fetch(url, {
      method: lieferant ? "PATCH" : "POST",
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
    router.push("/fibu/lieferanten")
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
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Name <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. Stadtwerke Stuttgart" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alias"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Alias (kommagetrennt)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DM, dm-drogerie, Drogeriemarkt" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ustid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USt-ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DE123456789" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DE.." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="standard_gewerk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard-Gewerk</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. Reinigung" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="standard_konto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard-Konto</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. 4250" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firma_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Firma (optional)</FormLabel>
                <Select
                  value={field.value || KEINE}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) =>
                          !v || v === KEINE
                            ? "Alle Firmen"
                            : (firmen.find((f) => f.id === v)?.name ?? "—")
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={KEINE}>Alle Firmen</SelectItem>
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
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/fibu/lieferanten")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {lieferant ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
