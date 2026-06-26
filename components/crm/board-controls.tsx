"use client"

import { useRouter } from "next/navigation"
import { LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FirmaRef, Pipeline } from "@/types/crm"

const ALLE = "__alle__"

export function BoardControls({
  pipelines,
  aktivPipelineId,
  firmen,
  firmaId,
  ansicht,
}: {
  pipelines: Pipeline[]
  aktivPipelineId: string
  firmen: FirmaRef[]
  firmaId: string
  ansicht: "kanban" | "liste"
}) {
  const router = useRouter()

  function go(next: { pipeline?: string; firma?: string; ansicht?: string }) {
    const p = next.pipeline ?? aktivPipelineId
    const f = next.firma ?? firmaId
    const a = next.ansicht ?? ansicht
    const qs = new URLSearchParams({ pipeline: p, ansicht: a })
    if (f) qs.set("firma", f)
    router.push(`/crm?${qs.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={aktivPipelineId} onValueChange={(v) => go({ pipeline: v ?? aktivPipelineId })}>
        <SelectTrigger className="w-52">
          <SelectValue>
            {(v) => pipelines.find((p) => p.id === v)?.name ?? "Pipeline"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {pipelines.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={firmaId || ALLE}
        onValueChange={(v) => go({ firma: v === ALLE || !v ? "" : v })}
      >
        <SelectTrigger className="w-52">
          <SelectValue>
            {(v) =>
              !v || v === ALLE
                ? "Alle Einheiten"
                : firmen.find((f) => f.id === v)?.name ?? "Einheit"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALLE}>Alle Einheiten</SelectItem>
          {firmen.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex overflow-hidden rounded-md border">
        <button
          type="button"
          onClick={() => go({ ansicht: "kanban" })}
          aria-label="Kanban-Ansicht"
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 text-sm",
            ansicht === "kanban" ? "bg-secondary/10 text-secondary" : "text-muted-foreground"
          )}
        >
          <LayoutGrid className="size-4" /> Kanban
        </button>
        <button
          type="button"
          onClick={() => go({ ansicht: "liste" })}
          aria-label="Listen-Ansicht"
          className={cn(
            "flex items-center gap-1 border-l px-2.5 py-1.5 text-sm",
            ansicht === "liste" ? "bg-secondary/10 text-secondary" : "text-muted-foreground"
          )}
        >
          <List className="size-4" /> Liste
        </button>
      </div>
    </div>
  )
}
