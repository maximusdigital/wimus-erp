"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertTriangle,
  CircleDot,
  FileX,
  GripVertical,
  Hammer,
  KeyRound,
  Mail,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import { istAbgeschlossen } from "@/lib/ops/status"
import { zeigtEskalation } from "@/lib/ops/eskalation"
import { useKanbanDnd, type KanbanItems } from "@/lib/hooks/use-kanban-dnd"
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

// Typ-Icons aus dem Kern-Lucide-Set (keine Emoji, Design-Konvention 004_400).
const TYP_ICON: Record<string, LucideIcon> = {
  schaden: AlertTriangle,
  reparatur: Wrench,
  reinigung: Sparkles,
  uebergabe: KeyRound,
  wartung: Hammer,
  anfrage: Mail,
  kuendigung: FileX,
  sonstiges: CircleDot,
}

/** Karteninhalt (auch im DragOverlay genutzt, dann ohne Sortable-Verkabelung). */
function KarteInhalt({
  vorgang,
  onMove,
  dragHandle,
}: {
  vorgang: VorgangMitRelationen
  onMove?: (id: string, status: string) => void
  dragHandle?: React.ReactNode
}) {
  const bezug = [vorgang.objekt?.kuerzel, einheitLabel(vorgang.einheit)].filter(Boolean).join(" · ")
  const ziele = VORGANG_STATUS.filter((s) => s !== vorgang.status)
  const TypIcon = vorgang.typ ? TYP_ICON[vorgang.typ] : null

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/vorgaenge/${vorgang.id}`}
          className="flex items-start gap-1 text-sm font-medium leading-tight hover:underline"
        >
          {zeigtEskalation(vorgang) ? (
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-label="Eskaliert" />
          ) : null}
          {vorgangTitel(vorgang)}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant={VORGANG_PRIORITAET_VARIANT[vorgang.prioritaet] ?? "secondary"}
            className="text-[0.7rem]"
          >
            {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ?? vorgang.prioritaet}
          </Badge>
          {onMove ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="icon" variant="ghost" className="size-6" aria-label="Status wechseln">
                    <GripVertical className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent>
                {ziele.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => onMove(vorgang.id, s)}>
                    → {VORGANG_STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            dragHandle
          )}
        </div>
      </div>
      <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
        <span className="truncate">{bezug || "Kein Bezug"}</span>
        {vorgang.typ ? (
          <span className="flex shrink-0 items-center gap-0.5">
            ·{TypIcon ? <TypIcon className="size-3" /> : null}
            {VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ}
          </span>
        ) : null}
      </p>
      {vorgang.leistungsdatum ? (
        <p className="mt-1 text-xs text-muted-foreground">Leistung: {formatDate(vorgang.leistungsdatum)}</p>
      ) : null}
    </>
  )
}

function Karte({
  vorgang,
  onMove,
  busy,
}: {
  vorgang: VorgangMitRelationen
  onMove: (id: string, status: string) => void
  busy: boolean
}) {
  const abgeschlossen = istAbgeschlossen(vorgang.status)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: vorgang.id,
    disabled: busy || abgeschlossen,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow",
        busy && "opacity-50",
        isDragging && "opacity-40",
        !abgeschlossen && "cursor-grab active:cursor-grabbing"
      )}
    >
      <KarteInhalt vorgang={vorgang} onMove={onMove} />
    </div>
  )
}

function Spalte({ status, count, children }: { status: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:w-72",
        isOver && "ring-2 ring-secondary"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{VORGANG_STATUS_LABELS[status]}</span>
        <Badge variant="secondary" className="text-[0.7rem]">
          {count}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function PlantafelBoard({ vorgaenge }: { vorgaenge: VorgangMitRelationen[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const byId = React.useMemo(() => {
    const m: Record<string, VorgangMitRelationen> = {}
    vorgaenge.forEach((v) => (m[v.id] = v))
    return m
  }, [vorgaenge])

  const initialItems = React.useMemo<KanbanItems>(() => {
    const m: KanbanItems = {}
    VORGANG_STATUS.forEach((s) => (m[s] = []))
    vorgaenge.forEach((v) => (m[v.status] ?? (m[v.status] = [])).push(v.id))
    return m
  }, [vorgaenge])

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
        const res = await fetch(`/api/vorgaenge/${id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: to }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => null)
          setError(j?.error ?? "Statuswechsel fehlgeschlagen.")
          router.refresh()
          return
        }
      }
      await fetch(`/api/vorgaenge/reorder`, {
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
    containers: [...VORGANG_STATUS],
    initialItems,
    isLocked: (id) => istAbgeschlossen(byId[id]?.status ?? ""),
    onPersist: persist,
  })

  // Dropdown-Fallback (mobile / a11y): reiner Statuswechsel.
  async function move(id: string, status: string) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/vorgaenge/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Statuswechsel fehlgeschlagen.")
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const activeVorgang = activeId ? byId[activeId] : null

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
        <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
          {VORGANG_STATUS.map((status) => {
            const ids = items[status] ?? []
            return (
              <Spalte key={status} status={status} count={ids.length}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {ids.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Keine Vorgänge</p>
                  ) : (
                    ids.map((id) =>
                      byId[id] ? (
                        <Karte key={id} vorgang={byId[id]} onMove={move} busy={busyId === id} />
                      ) : null
                    )
                  )}
                </SortableContext>
              </Spalte>
            )
          })}
        </div>
        <DragOverlay>
          {activeVorgang ? (
            <div className="rounded-lg border bg-card p-3 shadow-lg">
              <KarteInhalt vorgang={activeVorgang} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
