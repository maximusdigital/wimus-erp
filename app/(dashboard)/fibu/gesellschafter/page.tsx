import Link from "next/link"
import { Plus, Users } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { GesellschafterKarte } from "@/components/fibu/gesellschafter-karte"
import { GesellschafterTabelle } from "@/components/fibu/gesellschafter-tabelle"
import type { Gesellschafter } from "@/types/gesellschafter"

export const metadata = {
  title: "Gesellschafter",
}

export default async function GesellschafterPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("gesellschafter")
    .select("*")
    .order("name", { ascending: true })

  const gesellschafter = (data ?? []) as Gesellschafter[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gesellschafter</h1>
          <p className="text-muted-foreground text-sm">
            {gesellschafter.length}{" "}
            {gesellschafter.length === 1 ? "Gesellschafter" : "Gesellschafter"} ·
            Basis für die periodengenaue Ergebnisverteilung
          </p>
        </div>
        <Button render={<Link href="/fibu/gesellschafter/neu" />}>
          <Plus />
          <span>Neuer Gesellschafter</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : gesellschafter.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Gesellschafter</p>
            <p className="text-muted-foreground text-sm">
              Lege Gesellschafter an und ordne ihnen Beteiligungen an den
              Firmen/Buchungskreisen zu.
            </p>
          </div>
          <Button render={<Link href="/fibu/gesellschafter/neu" />} variant="outline">
            <Plus />
            <span>Gesellschafter anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <GesellschafterTabelle gesellschafter={gesellschafter} />
          </div>
          <div className="space-y-2 md:hidden">
            {gesellschafter.map((g) => (
              <GesellschafterKarte key={g.id} gesellschafter={g} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
