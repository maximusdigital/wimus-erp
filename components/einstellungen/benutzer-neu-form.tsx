"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { benutzerCreateSchema, type BenutzerCreate } from "@/lib/validations/benutzer"
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

/**
 * Benutzer anlegen (Stufe 0). Admin legt an; der Nutzer setzt sein Passwort selbst
 * über die E-Mail. Rollen werden hier NICHT vergeben (Stufe 1).
 */
export function BenutzerNeuForm({ mandanten }: { mandanten: { id: string; name: string }[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [mailWarnung, setMailWarnung] = useState(false)

  const form = useForm<BenutzerCreate>({
    resolver: zodResolver(benutzerCreateSchema),
    defaultValues: {
      email: "",
      vorname: "",
      nachname: "",
      mandant_id: mandanten[0]?.id ?? "",
    },
  })

  async function onSubmit(values: BenutzerCreate) {
    setError(null)
    setMailWarnung(false)
    const res = await fetch("/api/benutzer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      setError(body?.error ?? "Anlegen fehlgeschlagen.")
      return
    }
    if (body?.einladung_versendet === false) {
      // Nutzer angelegt, aber Mail nicht ausgelöst → nicht wegnavigieren, Hinweis zeigen.
      setMailWarnung(true)
      return
    }
    router.push("/einstellungen/benutzer")
    router.refresh()
  }

  if (mailWarnung) {
    return (
      <div className="max-w-xl space-y-3">
        <p className="text-sm text-warning">
          Benutzer angelegt, aber die Einladungs-/Passwort-Mail konnte nicht ausgelöst werden. Bitte
          den Passwort-Reset manuell nachholen (E-Mail-Versand prüfen).
        </p>
        <Button render={<Link href="/einstellungen/benutzer" />}>Zur Benutzerliste</Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                E-Mail <span className="text-danger">*</span>
              </FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@firma.de" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="vorname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vorname</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nachname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachname</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="mandant_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mandant <span className="text-danger">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Mandant wählen…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mandanten.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-xs text-muted-foreground">
          Der Benutzer erhält eine E-Mail, um sein Passwort selbst zu setzen. Rollen werden separat
          zugewiesen (folgt in Stufe 1).
        </p>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Anlegen…" : "Benutzer anlegen"}
          </Button>
          <Button type="button" variant="outline" render={<Link href="/einstellungen/benutzer" />}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  )
}
