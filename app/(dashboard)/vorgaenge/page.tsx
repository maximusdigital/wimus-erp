import Link from "next/link"
import { ClipboardList, Columns3, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { VorgangKarte } from "@/components/vorgaenge/vorgang-karte"
import { VorgangTabelle } from "@/components/vorgaenge/vorgang-tabelle"
import { FilterBar } from "@/components/search/filter-bar"
import { getEntity } from "@/lib/search/registry"
import { applyOps, buildQueryOps } from "@/lib/search/query-builder"
import type { FilterInput, FilterWert } from "@/lib/search/types"
import type { VorgangMitRelationen } from "@/types/vorgang"

export const metadata = {
  title: "Vorgänge",
}

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

export default async function VorgaengePage({
  searchParams,
}: {
  searchParams: Promise<{
    objekt?: string
    einheit?: string
    status?: string
    typ?: string
    prioritaet?: string
    q?: string
  }>
}) {
  const sp = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .schema("wimus")
    .from("vorgaenge")
    .select(SELECT)
    .order("leistungsdatum", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  // Direkte Bezugs-Filter (nicht in der Registry).
  if (sp.objekt) query = query.eq("objekt_id", sp.objekt)
  if (sp.einheit) query = query.eq("einheit_id", sp.einheit)

  // Registry-Filter + Freitext über die geteilte Such-Engine (RLS-konform).
  const filter: Record<string, FilterWert> = {}
  if (sp.status) filter.status = { op: "eq", value: sp.status }
  if (sp.typ) filter.typ = { op: "eq", value: sp.typ }
  if (sp.prioritaet) filter.prioritaet = { op: "eq", value: sp.prioritaet }
  const input: FilterInput = { suchtext: sp.q, filter }
  const entity = getEntity("vorgaenge")
  if (entity) query = applyOps(query, buildQueryOps(entity, input))

  const { data, error } = await query
  const vorgaenge = (data ?? []) as unknown as VorgangMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Vorgänge</h1>
          <p className="text-muted-foreground text-sm">
            {vorgaenge.length} {vorgaenge.length === 1 ? "Vorgang" : "Vorgänge"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href="/vorgaenge/plantafel" />}
          >
            <Columns3 />
            <span>Plantafel</span>
          </Button>
          <Button render={<Link href="/vorgaenge/neu" />}>
            <Plus />
            <span>Neuer Vorgang</span>
          </Button>
        </div>
      </div>

      <FilterBar entityKey="vorgaenge" />

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : vorgaenge.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Vorgänge</p>
            <p className="text-muted-foreground text-sm">
              Lege den ersten Vorgang an und verknüpfe ihn mit Objekt oder
              Einheit.
            </p>
          </div>
          <Button render={<Link href="/vorgaenge/neu" />} variant="outline">
            <Plus />
            <span>Vorgang anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <VorgangTabelle vorgaenge={vorgaenge} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {vorgaenge.map((v) => (
              <VorgangKarte key={v.id} vorgang={v} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
