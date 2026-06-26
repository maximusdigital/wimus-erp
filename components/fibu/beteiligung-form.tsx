"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pencil } from "lucide-react"

import {
  beteiligungFormSchema,
  type BeteiligungFormValues,
} from "@/lib/validations/gesellschafter"
import type { Beteiligung } from "@/types/gesellschafter"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export type FirmaOption = { id: string; name: string; kuerzel: string | null }

export function BeteiligungForm({
  gesellschafterId,
  firmen,
  beteiligung,
}: {
  gesellschafterId: string
  firmen: FirmaOption[]
  beteiligung?: Beteiligung
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const istEdit = Boolean(beteiligung)

  const form = useForm<BeteiligungFormValues>({
    resolver: zodResolver(beteiligungFormSchema),
    defaultValues: {
      firma_id: beteiligung?.firma_id ?? "",
      quote_prozent: beteiligung ? String(beteiligung.quote * 100) : "",
      gueltig_ab: beteiligung?.gueltig_ab ?? "",
      gueltig_bis: beteiligung?.gueltig_bis ?? "",
    },
  })

  async function onSubmit(values: BeteiligungFormValues) {
    setError(null)
    const url = beteiligung
      ? `/api/fibu/beteiligungen/${beteiligung.id}`
      : "/api/fibu/beteiligungen"
    const res = await fetch(url, {
      method: beteiligung ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gesellschafter_id: gesellschafterId,
        firma_id: values.firma_id,
        quote: values.quote_prozent,
        gueltig_ab: values.gueltig_ab,
        gueltig_bis: values.gueltig_bis,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    setOpen(false)
    form.reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={istEdit ? "ghost" : "outline"} size={istEdit ? "icon" : "default"}>
            {istEdit ? <Pencil /> : <><Plus /><span>Beteiligung</span></>}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {istEdit ? "Beteiligung bearbeiten" : "Neue Beteiligung"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {error ? (
              <div className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="firma_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Firma (Buchungskreis) <span className="text-danger">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Firma wählen…">
                          {(v) => firmen.find((f) => f.id === v)?.name ?? "Firma wählen…"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {firmen.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                          {f.kuerzel ? ` (${f.kuerzel})` : ""}
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
              name="quote_prozent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quote (%) <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="decimal"
                      placeholder="z. B. 50"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gueltig_ab"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Gültig ab <span className="text-danger">*</span>
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
                name="gueltig_bis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gültig bis</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {istEdit ? "Speichern" : "Hinzufügen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
