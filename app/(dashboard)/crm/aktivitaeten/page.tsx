import { createServerClient } from "@/lib/supabase/server"
import {
  AktivitaetenUebersicht,
  type AktMitDeal,
} from "@/components/crm/aktivitaeten-uebersicht"

export const metadata = { title: "CRM – Aktivitäten" }

export default async function AktivitaetenPage() {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("crm_deal_aktivitaeten")
    .select("*, deal:crm_deals(id, titel)")
    .order("erledigt", { ascending: true })
    .order("faellig_am", { ascending: true, nullsFirst: false })

  const items = (data ?? []) as AktMitDeal[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Aktivitäten</h1>
        <p className="text-sm text-muted-foreground">
          Was steht an – über alle Deals. Überfällig rot, heute grün.
        </p>
      </div>
      <AktivitaetenUebersicht items={items} />
    </div>
  )
}
