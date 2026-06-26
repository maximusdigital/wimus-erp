"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatEUR } from "@/lib/utils/format"
import { tageInStage, istStalled } from "@/lib/crm/stage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { DealMitBezug, PipelineStage } from "@/types/crm"

function kontaktName(d: DealMitBezug): string | null {
  if (d.organisation?.name) return d.organisation.name
  if (d.kontakt) {
    return [d.kontakt.vorname, d.kontakt.nachname].filter(Boolean).join(" ") || null
  }
  return null
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
  const tage = tageInStage(deal.in_stage_seit, new Date())
  const stalled = istStalled(tage, deal.stage?.stalled_tage ?? null)
  const name = kontaktName(deal)
  const andereStages = stages.filter((s) => s.id !== deal.stage_id)

  return (
    <div
      draggable={!busy}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/deal-id", deal.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow",
        busy && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/crm/deals/${deal.id}`} className="font-medium leading-tight hover:underline">
          {deal.titel}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="ghost" className="size-6 shrink-0" aria-label="Stage wechseln">
                <GripVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent>
            {andereStages.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => onMove(deal.id, s.id)}>
                → {s.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
  const [dragOver, setDragOver] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const sortStages = [...stages].sort((a, b) => a.sortierung - b.sortierung)

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
      setDragOver(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {sortStages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id)
          const summe = stageDeals.reduce((acc, d) => acc + (d.wert ?? 0), 0)
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(stage.id)
              }}
              onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                const dealId = e.dataTransfer.getData("text/deal-id")
                if (dealId) move(dealId, stage.id)
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-2",
                dragOver === stage.id && "ring-2 ring-secondary"
              )}
            >
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-sm font-semibold">{stage.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {stageDeals.length} · {formatEUR(summe)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    stages={sortStages}
                    onMove={move}
                    busy={busyId === deal.id}
                  />
                ))}
                {stageDeals.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-muted-foreground">Keine Deals</p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
