"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AlertTriangle, GripVertical } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatEUR } from "@/lib/utils/format"
import { tageInStage, istStalled } from "@/lib/crm/stage"
import { useKanbanDnd, type KanbanItems } from "@/lib/hooks/use-kanban-dnd"
import { Button } from "@/components/ui/button"
import type { DealMitBezug, PipelineStage } from "@/types/crm"

function kontaktName(d: DealMitBezug): string | null {
  if (d.organisation?.name) return d.organisation.name
  if (d.kontakt) {
    return [d.kontakt.vorname, d.kontakt.nachname].filter(Boolean).join(" ") || null
  }
  return null
}

/** Karteninhalt (auch im DragOverlay genutzt). */
function DealInhalt({
  deal,
  stages,
  onMove,
}: {
  deal: DealMitBezug
  stages: PipelineStage[]
  onMove?: (dealId: string, stageId: string) => void
}) {
  const tage = tageInStage(deal.in_stage_seit, new Date())
  const stalled = istStalled(tage, deal.stage?.stalled_tage ?? null)
  const name = kontaktName(deal)
  const andereStages = stages.filter((s) => s.id !== deal.stage_id)

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/crm/deals/${deal.id}`} className="font-medium leading-tight hover:underline">
          {deal.titel}
        </Link>
        {onMove ? (
          <DropdownStageMenu deal={deal} stages={andereStages} onMove={onMove} />
        ) : null}
      </div>

      {name ? <p className="mt-1 text-sm text-muted-foreground">{name}</p> : null}

      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium tabular-nums">{formatEUR(deal.wert)}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            stalled ? "text-danger" : "text-muted-foreground"
          )}
        >
          {stalled ? <AlertTriangle className="size-3" /> : null}
          {tage} {tage === 1 ? "Tag" : "Tage"}
        </span>
      </div>
    </>
  )
}

function DropdownStageMenu({
  deal,
  stages,
  onMove,
}: {
  deal: DealMitBezug
  stages: PipelineStage[]
  onMove: (dealId: string, stageId: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon" variant="ghost" className="size-6 shrink-0" aria-label="Stage wechseln">
            <GripVertical className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent>
        {stages.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => onMove(deal.id, s.id)}>
            → {s.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DealCard({
  deal,
  stages,
  onMove,
  busy,
}: {
  deal: DealMitBezug
  stages: PipelineStage[]
  onMove: (dealId: string, stageId: string) => void
  busy: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    disabled: busy,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow cursor-grab active:cursor-grabbing",
        busy && "opacity-50",
        isDragging && "opacity-40"
      )}
    >
      <DealInhalt deal={deal} stages={stages} onMove={onMove} />
    </div>
  )
}

function Spalte({
  stageId,
  name,
  count,
  summe,
  children,
}: {
  stageId: string
  name: string
  count: number
  summe: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-2",
        isOver && "ring-2 ring-secondary"
      )}
    >
      <div className="flex items-center justify-between px-1 py-1">
        <span className="text-sm font-semibold">{name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {count} · {formatEUR(summe)}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function KanbanBoard({
  stages,
  deals,
}: {
  stages: PipelineStage[]
  deals: DealMitBezug[]
}) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const sortStages = React.useMemo(
    () => [...stages].sort((a, b) => a.sortierung - b.sortierung),
    [stages]
  )
  const byId = React.useMemo(() => {
    const m: Record<string, DealMitBezug> = {}
    deals.forEach((d) => (m[d.id] = d))
    return m
  }, [deals])

  const initialItems = React.useMemo<KanbanItems>(() => {
    const m: KanbanItems = {}
    sortStages.forEach((s) => (m[s.id] = []))
    deals.forEach((d) => (m[d.stage_id] ?? (m[d.stage_id] = [])).push(d.id))
    return m
  }, [deals, sortStages])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  async function persist({
    id,
    from,
    to,
    orderedIds,
  }: {
    id: string
    from: string
    to: string
    orderedIds: string[]
  }) {
    setBusyId(id)
    setError(null)
    try {
      if (from !== to) {
        const res = await fetch(`/api/crm/deals/${id}/stage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage_id: to }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => null)
          setError(j?.error ?? "Stage-Wechsel fehlgeschlagen.")
          router.refresh()
          return
        }
      }
      await fetch(`/api/crm/deals/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: orderedIds }),
      })
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const { items, activeId, onDragStart, onDragOver, onDragEnd } = useKanbanDnd({
    containers: sortStages.map((s) => s.id),
    initialItems,
    onPersist: persist,
  })

  // Dropdown-Fallback (mobile / a11y): reiner Stage-Wechsel.
  async function move(dealId: string, stageId: string) {
    setBusyId(dealId)
    setError(null)
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: stageId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Stage-Wechsel fehlgeschlagen.")
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const activeDeal = activeId ? byId[activeId] : null

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {sortStages.map((stage) => {
            const ids = items[stage.id] ?? []
            const summe = ids.reduce((acc, id) => acc + (byId[id]?.wert ?? 0), 0)
            return (
              <Spalte key={stage.id} stageId={stage.id} name={stage.name} count={ids.length} summe={summe}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {ids.length === 0 ? (
                    <p className="px-1 py-4 text-center text-xs text-muted-foreground">Keine Deals</p>
                  ) : (
                    ids.map((id) =>
                      byId[id] ? (
                        <DealCard
                          key={id}
                          deal={byId[id]}
                          stages={sortStages}
                          onMove={move}
                          busy={busyId === id}
                        />
                      ) : null
                    )
                  )}
                </SortableContext>
              </Spalte>
            )
          })}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <div className="rounded-lg border bg-card p-3 shadow-lg">
              <DealInhalt deal={activeDeal} stages={sortStages} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
