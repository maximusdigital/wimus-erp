import { createServerClient } from "@/lib/supabase/server"
import { TaxonomieVerwaltung, type TaxonomieRow } from "@/components/fibu/taxonomie-verwaltung"

export const metadata = { title: "Berichtspositionen" }

export default async function ReportingTaxonomiePage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("reporting_taxonomie")
    .select("id, position_code, bezeichnung, mapping")
    .order("position_code")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Berichtspositionen (Taxonomie)</h1>
        <p className="text-muted-foreground text-sm">
          Rohe SKR03-/EÜR-Konten auf neutrale Berichtspositionen mappen — vereinheitlicht GuV
          über GmbH (SKR) und Privat (EÜR). In der Auswertung umschaltbar.
        </p>
      </div>
      <TaxonomieVerwaltung positionen={(data ?? []) as TaxonomieRow[]} />
    </div>
  )
}
