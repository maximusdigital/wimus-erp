import Link from "next/link"
import { BedDouble, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BuchungKarte } from "@/components/buchungen/buchung-karte"
import { BuchungTabelle } from "@/components/buchungen/buchung-tabelle"
import type { BuchungMitRelationen } from "@/types/buchung"

export const metadata = {
  title: "Buchungen",
}

const SELECT =
  "*, einheit:einheiten(verwendungszweck_code, bezeichnung, objekt_id, objekt:objekte(kuerzel)), gast:kontakte(vorname, nachname, firmenname)"

export default async function BuchungenPage({
  searchParams,
}: {
  searchParams: Promise<{ einheit?: string; gast?: string }>
}) {
  const { einheit, gast } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .schema("wimus")
    .from("buchungen")
    .select(SELECT)
    .order("checkin", { ascending: false, nullsFirst: false })

  if (einheit) query = query.eq("einheit_id", einheit)
  if (gast) query = query.eq("gast_id", gast)

  const { data, error } = await query

  const buchungen = (data ?? []) as unknown as BuchungMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Buchungen</h1>
          <p className="text-muted-foreground text-sm">
            {buchungen.length} {buchungen.length === 1 ? "Buchung" : "Buchungen"}{" "}
            (KZV)
          </p>
        </div>
        <Button render={<Link href="/buchungen/neu" />}>
          <Plus />
          <span>Neue Buchung</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : buchungen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BedDouble className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Buchungen</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste KZV-Buchung an und verknüpfe Einheit und Gast.
            </p>
          </div>
          <Button render={<Link href="/buchungen/neu" />} variant="outline">
            <Plus />
            <span>Buchung anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <BuchungTabelle buchungen={buchungen} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {buchungen.map((b) => (
              <BuchungKarte key={b.id} buchung={b} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
