"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"

import type {
  EinheitOption,
  MietvertragOption,
} from "@/lib/betriebskosten-options"
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

const mitgliedFormSchema = z.object({
  einheit_id: z.string().min(1, "Pflichtfeld"),
  mietvertrag_id: z.string().optional(),
  fester_anteil_pct: z.string().optional(),
  intern_abgerechnet: z.enum(["ja", "nein"]),
})

type MitgliedFormValues = z.infer<typeof mitgliedFormSchema>

export function MitgliedForm({
  abrechnungseinheitId,
  einheiten,
  mietvertraege,
}: {
  abrechnungseinheitId: string
  einheiten: EinheitOption[]
  mietvertraege: MietvertragOption[]
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<MitgliedFormValues>({
    resolver: zodResolver(mitgliedFormSchema),
    defaultValues: {
      einheit_id: "",
      mietvertrag_id: "",
      fester_anteil_pct: "",
      intern_abgerechnet: "nein",
    },
  })

  async function onSubmit(values: MitgliedFormValues) {
    setServerError(null)
    const res = await fetch(
      `/api/abrechnungseinheiten/${abrechnungseinheitId}/mitglieder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setServerError(body?.error ?? "Speichern fehlgeschlagen.")
      return
    }

    form.reset()
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="einheit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Einheit <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Einheit wählen…">
                        {(v) =>
                          einheiten.find((x) => x.id === v)?.label ??
                          "Einheit wählen…"
                        }
                      </SelectValue>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mietvertrag_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertrag</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keiner —">
                        {(v) =>
                          v && v !== NONE
                            ? (mietvertraege.find((x) => x.id === v)?.label ??
                              "— keiner —")
                            : "— keiner —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keiner —</SelectItem>
                    {mietvertraege.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
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
            name="fester_anteil_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fester Anteil (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="optional"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intern_abgerechnet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intern abgerechnet</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => (v === "ja" ? "Ja" : "Nein")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nein">Nein</SelectItem>
                    <SelectItem value="ja">Ja</SelectItem>
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

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Plus />
            <span>
              {form.formState.isSubmitting ? "Speichern…" : "Mitglied hinzufügen"}
            </span>
          </Button>
        </div>
      </form>
    </Form>
  )
}
