"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  gesellschafterFormSchema,
  type GesellschafterFormValues,
} from "@/lib/validations/gesellschafter"
import {
  GESELLSCHAFTER_TYPEN,
  GESELLSCHAFTER_TYP_LABELS,
  type Gesellschafter,
} from "@/types/gesellschafter"
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

export function GesellschafterForm({
  gesellschafter,
}: {
  gesellschafter?: Gesellschafter
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<GesellschafterFormValues>({
    resolver: zodResolver(gesellschafterFormSchema),
    defaultValues: {
      name: gesellschafter?.name ?? "",
      typ:
        (gesellschafter?.typ as GesellschafterFormValues["typ"]) ??
        "natuerliche_person",
      steuerliche_id: gesellschafter?.steuerliche_id ?? "",
      strasse: gesellschafter?.strasse ?? "",
      hausnummer: gesellschafter?.hausnummer ?? "",
      plz: gesellschafter?.plz ?? "",
      stadt: gesellschafter?.stadt ?? "",
      land: gesellschafter?.land ?? "DE",
    },
  })

  async function onSubmit(values: GesellschafterFormValues) {
    setError(null)
    const url = gesellschafter
      ? `/api/fibu/gesellschafter/${gesellschafter.id}`
      : "/api/fibu/gesellschafter"
    const res = await fetch(url, {
      method: gesellschafter ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    const saved = await res.json().catch(() => null)
    router.push(
      gesellschafter
        ? `/fibu/gesellschafter/${gesellschafter.id}`
        : saved?.id
          ? `/fibu/gesellschafter/${saved.id}`
          : "/fibu/gesellschafter"
    )
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
                  <Input {...field} placeholder="z. B. Maxim Moser / ALFA Holding GmbH" required />
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
                <FormLabel>
                  Typ <span className="text-danger">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => GESELLSCHAFTER_TYP_LABELS[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GESELLSCHAFTER_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {GESELLSCHAFTER_TYP_LABELS[t]}
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
            name="steuerliche_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Steuerliche ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Steuer-ID / Steuernummer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strasse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Straße</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hausnummer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hausnummer</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PLZ</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stadt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stadt</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="land"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Land</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DE" />
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
            onClick={() => router.push("/fibu/gesellschafter")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {gesellschafter ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
