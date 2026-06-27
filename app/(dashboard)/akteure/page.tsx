import { createServerClient } from "@/lib/supabase/server"
import { AkteurVerwaltung, type AkteurRow } from "@/components/ops/akteur-verwaltung"

export const metadata = { title: "Akteure" }

export default async function AkteurePage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("akteure")
    .select("*, kontakt:kontakte(vorname, nachname, firmenname), organisation:organisationen(name)")
    .order("name")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Akteure</h1>
        <p className="text-muted-foreground text-sm">
          Träger von Vorgängen — Mensch oder KI-Agent oder extern. Werden Vorgängen als
          Verantwortliche/Ausführende zugewiesen.
        </p>
      </div>
      <AkteurVerwaltung akteure={(data ?? []) as AkteurRow[]} />
    </div>
  )
}
