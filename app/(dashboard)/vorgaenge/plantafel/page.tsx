import Link from "next/link"
import { List, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { PlantafelBoard } from "@/components/vorgaenge/plantafel-board"
import type { VorgangMitRelationen } from "@/types/vorgang"

export const metadata = {
  title: "Plantafel – Vorgänge",
}

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

export default async function VorgangPlantafelPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("vorgaenge")
    .select(SELECT)
    .order("leistungsdatum", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  const vorgaenge = (data ?? []) as unknown as VorgangMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Plantafel</h1>
          <p className="text-muted-foreground text-sm">
            {vorgaenge.length} {vorgaenge.length === 1 ? "Vorgang" : "Vorgänge"} nach Status ·
            Karte ziehen = Status wechseln
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/vorgaenge" />}>
            <List />
            <span>Listenansicht</span>
          </Button>
          <Button render={<Link href="/vorgaenge/neu" />}>
            <Plus />
            <span>Neuer Vorgang</span>
          </Button>
        </div>
      </div>

      <PlantafelBoard vorgaenge={vorgaenge} />
    </div>
  )
}
