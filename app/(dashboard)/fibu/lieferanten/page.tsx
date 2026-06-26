import Link from "next/link"
import { Plus, Truck } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { LieferantKarte } from "@/components/fibu/lieferant-karte"
import { LieferantTabelle } from "@/components/fibu/lieferant-tabelle"
import type { LieferantMitFirma } from "@/types/lieferant"

export const metadata = {
  title: "Lieferanten",
}

export default async function LieferantenPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("lieferanten")
    .select("*, firma:firmen(id, name, kuerzel)")
    .order("name", { ascending: true })

  const lieferanten = (data ?? []) as LieferantMitFirma[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Lieferanten</h1>
          <p className="text-muted-foreground text-sm">
            {lieferanten.length}{" "}
            {lieferanten.length === 1 ? "Lieferant" : "Lieferanten"} · Kreditoren
            mit Alias &amp; Standard-Kontierung
          </p>
        </div>
        <Button render={<Link href="/fibu/lieferanten/neu" />}>
          <Plus />
          <span>Neuer Lieferant</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : lieferanten.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Truck className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Lieferanten</p>
            <p className="text-muted-foreground text-sm">
              Lege Kreditoren mit Alias-Erkennung und Standard-Gewerk/-Konto an.
            </p>
          </div>
          <Button render={<Link href="/fibu/lieferanten/neu" />} variant="outline">
            <Plus />
            <span>Lieferant anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <LieferantTabelle lieferanten={lieferanten} />
          </div>
          <div className="space-y-2 md:hidden">
            {lieferanten.map((l) => (
              <LieferantKarte key={l.id} lieferant={l} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
