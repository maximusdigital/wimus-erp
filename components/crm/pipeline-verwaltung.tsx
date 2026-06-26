"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MARKEN, markeLabel } from "@/lib/crm/constants"
import type { Pipeline, PipelineStage, VerlorenGrund } from "@/types/crm"

type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

async function jsonFetch(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.ok
}

export function PipelineVerwaltung({
  pipelines,
  gruende,
}: {
  pipelines: PipelineMitStages[]
  gruende: VerlorenGrund[]
}) {
  const router = useRouter()
  const [neuPipeline, setNeuPipeline] = React.useState("")
  const [neuMarke, setNeuMarke] = React.useState("uebergreifend")
  const [neuStage, setNeuStage] = React.useState<Record<string, string>>({})
  const [neuGrund, setNeuGrund] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  async function addPipeline() {
    if (!neuPipeline.trim()) return
    setBusy(true)
    if (await jsonFetch("/api/crm/pipelines", "POST", { name: neuPipeline, marke: neuMarke })) {
      setNeuPipeline("")
      router.refresh()
    }
    setBusy(false)
  }

  async function addStage(pipelineId: string, stages: PipelineStage[]) {
    const name = neuStage[pipelineId]?.trim()
    if (!name) return
    setBusy(true)
    const sortierung = stages.length
    if (
      await jsonFetch("/api/crm/stages", "POST", {
        pipeline_id: pipelineId,
        name,
        sortierung,
        wahrscheinlichkeit: 0,
      })
    ) {
      setNeuStage((s) => ({ ...s, [pipelineId]: "" }))
      router.refresh()
    }
    setBusy(false)
  }

  async function delStage(id: string) {
    setBusy(true)
    if (await jsonFetch(`/api/crm/stages/${id}`, "DELETE", undefined)) router.refresh()
    setBusy(false)
  }

  async function addGrund() {
    if (!neuGrund.trim()) return
    setBusy(true)
    if (await jsonFetch("/api/crm/verloren-gruende", "POST", { bezeichnung: neuGrund })) {
      setNeuGrund("")
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Neue Pipeline */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Pipelines</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={neuPipeline}
              onChange={(e) => setNeuPipeline(e.target.value)}
              placeholder="z. B. Ankauf"
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Marke</Label>
            <Select value={neuMarke} onValueChange={(v) => setNeuMarke(v ?? "uebergreifend")}>
              <SelectTrigger className="w-48">
                <SelectValue>{(v) => markeLabel(String(v))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MARKEN.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addPipeline} disabled={busy} size="sm">
            <Plus className="size-4" /> Pipeline
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {pipelines.map((p) => {
            const stages = [...p.stages].sort((a, b) => a.sortierung - b.sortierung)
            return (
              <div key={p.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium">
                    {p.name}{" "}
                    <span className="text-xs text-muted-foreground">· {markeLabel(p.marke)}</span>
                    {p.default_pipeline ? (
                      <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                        Standard
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stages.map((s) => (
                    <span
                      key={s.id}
                      className="group flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                    >
                      {s.name}
                      <span className="text-muted-foreground">{s.wahrscheinlichkeit}%</span>
                      <button
                        onClick={() => delStage(s.id)}
                        aria-label="Stage löschen"
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <Input
                    value={neuStage[p.id] ?? ""}
                    onChange={(e) => setNeuStage((st) => ({ ...st, [p.id]: e.target.value }))}
                    placeholder="Neue Stage…"
                    className="w-48"
                  />
                  <Button onClick={() => addStage(p.id, stages)} disabled={busy} size="sm" variant="outline">
                    <Plus className="size-4" /> Stage
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Verloren-Gründe */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Verloren-Gründe</h2>
        <div className="flex flex-wrap gap-1.5">
          {gruende.map((g) => (
            <span key={g.id} className="rounded-full border px-2.5 py-1 text-xs">
              {g.bezeichnung}
            </span>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Input
            value={neuGrund}
            onChange={(e) => setNeuGrund(e.target.value)}
            placeholder="Neuer Grund…"
            className="w-56"
          />
          <Button onClick={addGrund} disabled={busy} size="sm" variant="outline">
            <Plus className="size-4" /> Grund
          </Button>
        </div>
      </section>
    </div>
  )
}
