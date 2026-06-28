import Link from "next/link"
import { Plus, Inbox, ListChecks } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { formatEUR } from "@/lib/utils/format"
import { markeLabel } from "@/lib/crm/constants"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { DealListe } from "@/components/crm/deal-liste"
import { BoardControls } from "@/components/crm/board-controls"
import type { DealMitBezug, FirmaRef, Pipeline, PipelineStage } from "@/types/crm"

export const metadata = { title: "CRM – Pipeline" }

type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

export default async function CrmBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string; firma?: string; ansicht?: string }>
}) {
  const { pipeline: pipelineParam, firma: firmaParam, ansicht: ansichtParam } =
    await searchParams
  const supabase = await createServerClient()

  const [{ data: pipelinesRaw }, { data: firmenRaw }] = await Promise.all([
    supabase
      .from("crm_pipelines")
      .select("*, stages:crm_pipeline_stages(*)")
      .eq("aktiv", true)
      .order("sortierung", { ascending: true }),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
  ])

  const pipelines = (pipelinesRaw ?? []) as PipelineMitStages[]
  const firmen = (firmenRaw ?? []) as FirmaRef[]
  const firmaId = firmaParam ?? ""
  const ansicht: "kanban" | "liste" = ansichtParam === "liste" ? "liste" : "kanban"

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Header />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">Noch keine Pipeline</p>
          <p className="text-sm text-muted-foreground">
            Lege eine Pipeline mit Stages an, um Deals im Kanban zu verwalten.
          </p>
          <Button render={<Link href="/crm/pipelines" />} variant="outline">
            <Plus /> <span>Pipeline anlegen</span>
          </Button>
        </div>
      </div>
    )
  }

  const aktiv =
    pipelines.find((p) => p.id === pipelineParam) ??
    pipelines.find((p) => p.default_pipeline) ??
    pipelines[0]

  let dealsQuery = supabase
    .from("crm_deals")
    .select(
      "*, kontakt:kontakte(id, vorname, nachname), organisation:organisationen(id, name), stage:crm_pipeline_stages(id, name, ist_gewonnen, ist_verloren, stalled_tage)"
    )
    .eq("pipeline_id", aktiv.id)
    .eq("status", "offen")
    .order("board_sort", { ascending: true })
    .order("created_at", { ascending: false })
  if (firmaId) dealsQuery = dealsQuery.eq("firma_id", firmaId)
  const { data: dealsRaw } = await dealsQuery

  const deals = (dealsRaw ?? []) as DealMitBezug[]
  const summe = deals.reduce((acc, d) => acc + (d.wert ?? 0), 0)

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <Header />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <BoardControls
            pipelines={pipelines}
            aktivPipelineId={aktiv.id}
            firmen={firmen}
            firmaId={firmaId}
            ansicht={ansicht}
          />
          <span className="text-sm text-muted-foreground">
            {markeLabel(aktiv.marke)} · {deals.length} offen · {formatEUR(summe)}
          </span>
        </div>
        <Button render={<Link href={`/crm/deals/neu?pipeline=${aktiv.id}`} />}>
          <Plus /> <span>Deal</span>
        </Button>
      </div>

      {ansicht === "liste" ? (
        <DealListe deals={deals} stages={aktiv.stages} />
      ) : (
        <KanbanBoard stages={aktiv.stages} deals={deals} />
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Vertrieb</h1>
        <p className="text-sm text-muted-foreground">Deal-Pipeline (Kanban)</p>
      </div>
      <div className="flex gap-2">
        <Button render={<Link href="/crm/leads" />} variant="outline" size="sm">
          <Inbox className="size-4" /> <span>Lead-Inbox</span>
        </Button>
        <Button render={<Link href="/crm/aktivitaeten" />} variant="outline" size="sm">
          <ListChecks className="size-4" /> <span>Aktivitäten</span>
        </Button>
      </div>
    </div>
  )
}
