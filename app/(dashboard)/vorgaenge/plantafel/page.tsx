import Link from "next/link"
import { List, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils/format"
import {
  einheitLabel,
  vorgangTitel,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_PRIORITAET_VARIANT,
  VORGANG_STATUS,
  VORGANG_STATUS_LABELS,
  VORGANG_TYP_LABELS,
  type VorgangMitRelationen,
} from "@/types/vorgang"

export const metadata = {
  title: "Plantafel – Vorgänge",
}

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

function PlantafelKarte({ vorgang }: { vorgang: VorgangMitRelationen }) {
  const bezug = [vorgang.objekt?.kuerzel, einheitLabel(vorgang.einheit)]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link
      href={`/vorgaenge/${vorgang.id}`}
      className="block rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">
          {vorgangTitel(vorgang)}
        </span>
        <Badge
          variant={VORGANG_PRIORITAET_VARIANT[vorgang.prioritaet] ?? "secondary"}
          className="shrink-0 text-[0.7rem]"
        >
          {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ?? vorgang.prioritaet}
        </Badge>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {bezug || "Kein Bezug"}
        {vorgang.typ
          ? ` · ${VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ}`
          : ""}
      </p>
      {vorgang.leistungsdatum ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Leistung: {formatDate(vorgang.leistungsdatum)}
        </p>
      ) : null}
    </Link>
  )
}

export default async function VorgangPlantafelPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("vorgaenge")
    .select(SELECT)
    .order("leistungsdatum", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  const vorgaenge = (data ?? []) as unknown as VorgangMitRelationen[]

  const spalten = VORGANG_STATUS.map((status) => ({
    status,
    label: VORGANG_STATUS_LABELS[status],
    items: vorgaenge.filter((v) => v.status === status),
  }))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Plantafel</h1>
          <p className="text-muted-foreground text-sm">
            {vorgaenge.length} {vorgaenge.length === 1 ? "Vorgang" : "Vorgänge"}{" "}
            nach Status
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

      {/* Mobile: Spalten untereinander · ab md: horizontale Kanban-Spalten */}
      <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
        {spalten.map((spalte) => (
          <div
            key={spalte.status}
            className="flex shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:w-72"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{spalte.label}</span>
              <Badge variant="secondary" className="text-[0.7rem]">
                {spalte.items.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {spalte.items.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Keine Vorgänge
                </p>
              ) : (
                spalte.items.map((v) => (
                  <PlantafelKarte key={v.id} vorgang={v} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
