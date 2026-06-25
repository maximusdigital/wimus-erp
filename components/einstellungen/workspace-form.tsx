"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  workspaceFormSchema,
  type WorkspaceFormValues,
} from "@/lib/validations/workspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const FIELDS: { name: keyof WorkspaceFormValues; label: string }[] = [
  { name: "kuerzel", label: "Kürzel" },
  { name: "inhaber", label: "Inhaber" },
  { name: "strasse", label: "Straße" },
  { name: "hausnummer", label: "Hausnummer" },
  { name: "plz", label: "PLZ" },
  { name: "stadt", label: "Stadt" },
  { name: "telefon", label: "Telefon" },
  { name: "email", label: "E-Mail" },
  { name: "website", label: "Website" },
  { name: "logo_url", label: "Logo-URL" },
]

export function WorkspaceForm({
  workspace,
}: {
  workspace: Record<string, unknown>
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const s = (k: string) => (workspace[k] as string | null) ?? ""

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: s("name"),
      kuerzel: s("kuerzel"),
      inhaber: s("inhaber"),
      strasse: s("strasse"),
      hausnummer: s("hausnummer"),
      plz: s("plz"),
      stadt: s("stadt"),
      telefon: s("telefon"),
      email: s("email"),
      website: s("website"),
      ci_farbe_primary: s("ci_farbe_primary"),
      logo_url: s("logo_url"),
    },
  })

  async function onSubmit(values: WorkspaceFormValues) {
    setError(null)
    setSaved(false)
    const res = await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    setSaved(true)
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
        {saved ? (
          <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success">
            Gespeichert.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {FIELDS.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="ci_farbe_primary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CI-Primärfarbe</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value || "#1F4E5F"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="size-8 shrink-0 rounded-md border"
                      aria-label="Farbe wählen"
                    />
                    <Input {...field} placeholder="#1F4E5F" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Speichern
          </Button>
        </div>
      </form>
    </Form>
  )
}
