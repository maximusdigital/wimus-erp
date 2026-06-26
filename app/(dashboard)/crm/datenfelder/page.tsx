import { createServerClient } from "@/lib/supabase/server"
import { DatenfeldVerwaltung } from "@/components/crm/datenfeld-verwaltung"
import type { CustomFieldDefinition } from "@/types/crm"

export const metadata = { title: "CRM – Datenfelder" }

export default async function DatenfelderPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("crm_custom_field_definitionen")
    .select("*")
    .order("sortierung")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Datenfelder</h1>
        <p className="text-sm text-muted-foreground">
          Custom-Fields für Deals &amp; Leads – Feldtyp, Anzeige, Qualitätsregeln (Pflicht/Wichtig).
        </p>
      </div>
      <DatenfeldVerwaltung felder={(data ?? []) as CustomFieldDefinition[]} />
    </div>
  )
}
