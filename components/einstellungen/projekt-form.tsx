"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  projektFormSchema,
  type ProjektFormValues,
} from "@/lib/validations/projekt"
import type { Firma } from "@/types/firma"
import {
  PROJEKT_STATUS,
  PROJEKT_STATUS_LABELS,
  PROJEKT_TYPEN,
  PROJEKT_TYP_LABELS,
  type Projekt,
} from "@/types/projekt"
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

export type ProjektEdit = Projekt & {
  status: string | null
  firma_id: string | null
  marke: string | null
  domain: string | null
  email: string | null
  telefon: string | null
  whatsapp: string | null
  aktiv: boolean | null
}

const NONE = "__none__"

export function ProjektForm({
  projekt,
  firmen,
  projekte,
}: {
  projekt?: ProjektEdit
  firmen: Firma[]
  projekte: Projekt[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProjektFormValues>({
    resolver: zodResolver(projektFormSchema),
    defaultValues: {
      name: projekt?.name ?? "",
      kuerzel: projekt?.kuerzel ?? "",
      typ: projekt?.typ ?? "",
      status: (projekt?.status as ProjektFormValues["status"]) ?? "aktiv",
      firma_id: projekt?.firma_id ?? "",
      parent_projekt_id: projekt?.parent_projekt_id ?? "",
      marke: projekt?.marke ?? "",
      domain: projekt?.domain ?? "",
      email: projekt?.email ?? "",
      telefon: projekt?.telefon ?? "",
      whatsapp: projekt?.whatsapp ?? "",
      ci_farbe_primary: projekt?.ci_farbe_primary ?? "",
      aktiv: projekt?.aktiv === false ? "nein" : "ja",
    },
  })

  async function onSubmit(values: ProjektFormValues) {
    setError(null)
    const url = projekt ? `/api/projekte/${projekt.id}` : "/api/projekte"
    const res = await fetch(url, {
      method: projekt ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    router.push("/einstellungen/projekte")
    router.refresh()
  }

  // Parent-Auswahl: sich selbst ausschließen.
  const parentOptions = projekte.filter((p) => p.id !== projekt?.id)

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
          <FormField
            control={form.control}
            name="kuerzel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Kürzel <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} required />
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
                      <SelectValue placeholder="Auswählen…">
                        {(v) => (v ? (PROJEKT_TYP_LABELS[v] ?? v) : "Auswählen…")}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJEKT_TYPEN.map((t) => (
                      <SelectItem key={t} value={t}>
                        {PROJEKT_TYP_LABELS[t]}
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
                        {(v) => PROJEKT_STATUS_LABELS[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJEKT_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROJEKT_STATUS_LABELS[s]}
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
                <FormLabel>Firma</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keine —">
                        {(v) =>
                          v && v !== NONE
                            ? (firmen.find((f) => f.id === v)?.name ?? "— keine —")
                            : "— keine —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keine —</SelectItem>
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
            name="parent_projekt_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Übergeordnetes Projekt</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— Top-Level —">
                        {(v) =>
                          v && v !== NONE
                            ? (projekte.find((p) => p.id === v)?.name ?? "— Top-Level —")
                            : "— Top-Level —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— Top-Level —</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
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
            name="marke"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marke</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="leer = vom Parent erben" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. alfa-apartments.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="aktiv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aktiv</FormLabel>
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

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/einstellungen/projekte")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {projekt ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
