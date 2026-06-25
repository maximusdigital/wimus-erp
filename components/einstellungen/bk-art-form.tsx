"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { bkArtFormSchema, type BkArtFormValues } from "@/lib/validations/bk-art"
import {
  BK_KATEGORIEN,
  BK_KATEGORIE_LABELS,
  BK_SCHLUESSEL,
  BK_SCHLUESSEL_LABELS,
  type BkArt,
} from "@/types/bk-art"
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

const JANEIN_FIELDS: { name: keyof BkArtFormValues; label: string }[] = [
  { name: "umlagefaehig", label: "Umlagefähig" },
  { name: "hkvo_pflichtig", label: "HKVO-pflichtig" },
  { name: "verbrauchsabhaengig", label: "Verbrauchsabhängig" },
  { name: "zaehlerpflicht", label: "Zählerpflicht" },
  { name: "aktiv", label: "Aktiv" },
]

function bool(v: boolean | null | undefined, fallback: boolean): "ja" | "nein" {
  const resolved = v == null ? fallback : v
  return resolved ? "ja" : "nein"
}

export function BkArtForm({ bkArt }: { bkArt?: BkArt }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BkArtFormValues>({
    resolver: zodResolver(bkArtFormSchema),
    defaultValues: {
      bezeichnung: bkArt?.bezeichnung ?? "",
      code: bkArt?.code ?? "",
      kategorie: bkArt?.kategorie ?? "",
      betrkv_nr: bkArt?.betrkv_nr ?? "",
      standard_schluessel: bkArt?.standard_schluessel ?? "",
      hkvo_verbrauch_pct:
        bkArt?.hkvo_verbrauch_pct != null ? String(bkArt.hkvo_verbrauch_pct) : "",
      umlagefaehig: bool(bkArt?.umlagefaehig, true),
      hkvo_pflichtig: bool(bkArt?.hkvo_pflichtig, false),
      verbrauchsabhaengig: bool(bkArt?.verbrauchsabhaengig, false),
      zaehlerpflicht: bool(bkArt?.zaehlerpflicht, false),
      aktiv: bool(bkArt?.aktiv, true),
    },
  })

  async function onSubmit(values: BkArtFormValues) {
    setError(null)
    const url = bkArt ? `/api/bk-arten/${bkArt.id}` : "/api/bk-arten"
    const res = await fetch(url, {
      method: bkArt ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    router.push("/einstellungen/bk-arten")
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
            name="bezeichnung"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Bezeichnung <span className="text-danger">*</span>
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kategorie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategorie</FormLabel>
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— keine —">
                        {(v) =>
                          v && v !== NONE
                            ? (BK_KATEGORIE_LABELS[v] ?? v)
                            : "— keine —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keine —</SelectItem>
                    {BK_KATEGORIEN.map((k) => (
                      <SelectItem key={k} value={k}>
                        {BK_KATEGORIE_LABELS[k]}
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
            name="betrkv_nr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BetrKV-Nr.</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="z. B. § 2 Nr. 4" />
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
                      <SelectValue placeholder="— keine —">
                        {(v) =>
                          v && v !== NONE
                            ? (BK_SCHLUESSEL_LABELS[v] ?? v)
                            : "— keine —"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>— keine —</SelectItem>
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
            name="hkvo_verbrauch_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HKVO-Verbrauch (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={0} max={100} placeholder="z. B. 70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {JANEIN_FIELDS.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v) => (v === "ja" ? "Ja" : "Nein")}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ja">Ja</SelectItem>
                      <SelectItem value="nein">Nein</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/einstellungen/bk-arten")}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {bkArt ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
