"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  fibuKontoFormSchema,
  type FibuKontoFormValues,
} from "@/lib/validations/fibu-konto"
import {
  KONTOARTEN,
  KONTOART_LABELS,
  SKR_BASEN,
  SKR_BASIS_LABELS,
  type FibuKonto,
} from "@/types/fibu-konto"
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

export function FibuKontoForm({
  konto,
  firmen,
}: {
  konto?: FibuKonto
  firmen: FirmaOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FibuKontoFormValues>({
    resolver: zodResolver(fibuKontoFormSchema),
    defaultValues: {
      kontonummer: konto?.kontonummer ?? "",
      bezeichnung: konto?.bezeichnung ?? "",
      kontoart: konto?.kontoart ?? "",
      skr_basis: konto?.skr_basis ?? "",
      ust_automatik: konto?.ust_automatik ?? "",
      firma_id: konto?.firma_id ?? "",
    },
  })

  async function onSubmit(values: FibuKontoFormValues) {
    setError(null)
    const url = konto ? `/api/fibu/konten/${konto.id}` : "/api/fibu/konten"
    const res = await fetch(url, {
      method: konto ? "PATCH" : "POST",
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
    router.push("/fibu/konten")
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
            name="kontonummer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Kontonummer <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" placeholder="z. B. 4250" required />
                </FormControl>
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
                  <Input {...field} placeholder="z. B. Reinigung" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kontoart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontoart</FormLabel>
                <Select
                  value={field.value || KEINE}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) =>
                          !v || v === KEINE ? "—" : (KONTOART_LABELS[v] ?? v)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={KEINE}>—</SelectItem>
                    {KONTOARTEN.map((k) => (
                      <SelectItem key={k} value={k}>
                        {KONTOART_LABELS[k]}
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
            name="skr_basis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKR-Basis</FormLabel>
                <Select
                  value={field.value || KEINE}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) =>
                          !v || v === KEINE ? "—" : (SKR_BASIS_LABELS[v] ?? v)
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={KEINE}>—</SelectItem>
                    {SKR_BASEN.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SKR_BASIS_LABELS[s]}
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
            name="ust_automatik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USt-Automatik</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. 19 / 7 / frei" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firma_id"
            render={({ field }) => (
              <FormItem>
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
            onClick={() => router.push("/fibu/konten")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {konto ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
