"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GripVertical } from "lucide-react"

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

function Karte({
  vorgang,
  onMove,
  busy,
}: {
  vorgang: VorgangMitRelationen
  onMove: (id: string, status: string) => void
  busy: boolean
}) {
  const bezug = [vorgang.objekt?.kuerzel, einheitLabel(vorgang.einheit)].filter(Boolean).join(" · ")
  const abgeschlossen = istAbgeschlossen(vorgang.status)
  const ziele = VORGANG_STATUS.filter((s) => s !== vorgang.status)

  return (
    <div
      draggable={!busy && !abgeschlossen}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/vorgang-id", vorgang.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow",
        busy && "opacity-50",
        !abgeschlossen && "cursor-grab"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/vorgaenge/${vorgang.id}`} className="text-sm font-medium leading-tight hover:underline">
          {vorgangTitel(vorgang)}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant={VORGANG_PRIORITAET_VARIANT[vorgang.prioritaet] ?? "secondary"}
            className="text-[0.7rem]"
          >
            {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ?? vorgang.prioritaet}
          </Badge>
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
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {bezug || "Kein Bezug"}
        {vorgang.typ ? ` · ${VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ}` : ""}
      </p>
      {vorgang.leistungsdatum ? (
        <p className="mt-1 text-xs text-muted-foreground">Leistung: {formatDate(vorgang.leistungsdatum)}</p>
      ) : null}
    </div>
  )
}

export function PlantafelBoard({ vorgaenge }: { vorgaenge: VorgangMitRelationen[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

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
      setDragOver(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
        {VORGANG_STATUS.map((status) => {
          const items = vorgaenge.filter((v) => v.status === status)
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(status)
              }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData("text/vorgang-id")
                if (id) move(id, status)
              }}
              className={cn(
                "flex shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:w-72",
                dragOver === status && "ring-2 ring-secondary"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{VORGANG_STATUS_LABELS[status]}</span>
                <Badge variant="secondary" className="text-[0.7rem]">
                  {items.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">Keine Vorgänge</p>
                ) : (
                  items.map((v) => (
                    <Karte key={v.id} vorgang={v} onMove={move} busy={busyId === v.id} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
