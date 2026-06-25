"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { fristFormSchema, type FristFormValues } from "@/lib/validations/frist"
import {
  FRIST_STATUS,
  FRIST_STATUS_LABELS,
  FRIST_TYPEN,
  FRIST_TYP_LABELS,
  type Frist,
} from "@/types/frist"
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

export function FristForm({ frist }: { frist?: Frist }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FristFormValues>({
    resolver: zodResolver(fristFormSchema),
    defaultValues: {
      frist_typ: (frist?.frist_typ as FristFormValues["frist_typ"]) ?? "bk_anpassung",
      bezeichnung: frist?.bezeichnung ?? "",
      start_datum: frist?.start_datum ?? "",
      faellig_am: frist?.faellig_am ?? "",
      erinnerung_tage_vorher: frist?.erinnerung_tage_vorher
        ? frist.erinnerung_tage_vorher.join(", ")
        : "",
      aktion_typ: frist?.aktion_typ ?? "",
      status: (frist?.status as FristFormValues["status"]) ?? "offen",
    },
  })

  async function onSubmit(values: FristFormValues) {
    setError(null)
    const url = frist ? `/api/fristen/${frist.id}` : "/api/fristen"
    const res = await fetch(url, {
      method: frist ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    router.push("/fristen")
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
            name="frist_typ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fristtyp <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auswählen…">
                        {(v) => (v ? (FRIST_TYP_LABELS[v] ?? v) : "Auswählen…")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FRIST_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {FRIST_TYP_LABELS[t]}
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
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => FRIST_STATUS_LABELS[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FRIST_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {FRIST_STATUS_LABELS[s]}
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Bezeichnung</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. Mieterhöhung BHS16 W3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_datum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start-Datum</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faellig_am"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fällig am <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="erinnerung_tage_vorher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Erinnerung (Tage vorher)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="30, 14, 7, 1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aktion_typ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aktionstyp</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. email, aufgabe" />
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
            onClick={() => router.push("/fristen")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {frist ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
