import { createServerClient } from "@/lib/supabase/server"
import { listDefs } from "@/lib/felder/definition"
import { FELD_ENTITAETEN, type FieldDef } from "@/lib/felder/types"
import { FelderVerwaltung } from "@/components/felder/felder-verwaltung"

export const metadata = { title: "Einstellungen – Datenfelder" }

export default async function FelderPage() {
  const supabase = await createServerClient()
  const entries = await Promise.all(
    FELD_ENTITAETEN.map(async (e) => [e.value, await listDefs(supabase, e.value)] as const),
  )
  const defsByEntitaet: Record<string, FieldDef[]> = Object.fromEntries(entries)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Datenfelder</h1>
        <p className="text-sm text-muted-foreground">
          Eigene Felder je Entität (Person, Organisation, Vorgang …) – stabiler Schlüssel, je Feld
          filterbar. System-Felder sind geschützt.
        </p>
      </div>
      <FelderVerwaltung defsByEntitaet={defsByEntitaet} />
    </div>
  )
}
