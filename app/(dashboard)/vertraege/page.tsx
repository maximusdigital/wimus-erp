import Link from "next/link"
import { FileText, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Button } from "@/components/ui/button"
import { VertragKarte } from "@/components/vertraege/vertrag-karte"
import { VertragTabelle } from "@/components/vertraege/vertrag-tabelle"
import type { VertragMitRelationen } from "@/types/vertrag"

export const metadata = {
  title: "Verträge",
}

const SELECT =
  "*, objekt:objekte(kuerzel, bezeichnung), einheit:einheiten(verwendungszweck_code, bezeichnung), mieter:kontakte(vorname, nachname, firma)"

export default async function VertraegePage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; mieter?: string }>
}) {
  const { objekt, mieter } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from("vertraege")
    .select(SELECT)
    .order("beginn", { nullsFirst: false })

  if (objekt) query = query.eq("objekt_id", objekt)
  if (mieter) query = query.eq("mieter_id", mieter)

  const { data, error } = await query

  let vertraege = (data ?? []) as unknown as VertragMitRelationen[]

  // Vorschau/Demo: Demo-Daten, damit die Liste ohne DB befüllt ist.
  if (isPreviewNoAuth() && vertraege.length === 0) {
    vertraege = DEMO_VERTRAEGE.filter(
      (v) =>
        (!objekt || v.objekt_id === objekt) &&
        (!mieter || v.mieter_id === mieter)
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Verträge</h1>
          <p className="text-muted-foreground text-sm">
            {vertraege.length} {vertraege.length === 1 ? "Vertrag" : "Verträge"}
          </p>
        </div>
        <Button render={<Link href="/vertraege/neu" />}>
          <Plus />
          <span>Neuer Vertrag</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : vertraege.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Verträge</p>
            <p className="text-muted-foreground text-sm">
              Lege den ersten Mietvertrag an und verknüpfe Einheit und Mieter.
            </p>
          </div>
          <Button render={<Link href="/vertraege/neu" />} variant="outline">
            <Plus />
            <span>Vertrag anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <VertragTabelle vertraege={vertraege} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {vertraege.map((v) => (
              <VertragKarte key={v.id} vertrag={v} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
