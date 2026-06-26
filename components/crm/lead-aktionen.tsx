"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRightCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FirmaRef, Lead, Pipeline, PipelineStage } from "@/types/crm"

type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

export function LeadAktionen({
  lead,
  firmen,
  pipelines,
}: {
  lead: Pick<Lead, "id" | "name">
  firmen: FirmaRef[]
  pipelines: PipelineMitStages[]
}) {
  const router = useRouter()
  const [konvOpen, setKonvOpen] = React.useState(false)
  const [verwOpen, setVerwOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [firmaId, setFirmaId] = React.useState(firmen[0]?.id ?? "")
  const [pipelineId, setPipelineId] = React.useState(
    pipelines.find((p) => p.default_pipeline)?.id ?? pipelines[0]?.id ?? ""
  )
  const [titel, setTitel] = React.useState(lead.name)
  const [wert, setWert] = React.useState("")
  const [grund, setGrund] = React.useState("")

  const stages = pipelines.find((p) => p.id === pipelineId)?.stages ?? []
  const startStage = [...stages].sort((a, b) => a.sortierung - b.sortierung)[0]

  async function konvertieren() {
    if (!firmaId || !pipelineId || !startStage) {
      setError("Mandant/Einheit, Pipeline und Stage sind nötig.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/konvertieren`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firma_id: firmaId,
          pipeline_id: pipelineId,
          stage_id: startStage.id,
          titel,
          wert: wert || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Konvertierung fehlgeschlagen.")
        return
      }
      const j = await res.json()
      router.push(`/crm/deals/${j.deal_id}`)
    } finally {
      setBusy(false)
    }
  }

  async function verwerfen() {
    if (!grund.trim()) {
      setError("Grund ist Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/verwerfen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verworfen_grund: grund }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Verwerfen fehlgeschlagen.")
        return
      }
      setVerwOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => setKonvOpen(true)}>
        <ArrowRightCircle className="size-4" /> <span className="hidden sm:inline">Konvertieren</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-danger"
        aria-label="Verwerfen"
        onClick={() => setVerwOpen(true)}
      >
        <XCircle className="size-4" />
      </Button>

      {/* Konvertieren */}
      <Dialog open={konvOpen} onOpenChange={setKonvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead zu Deal konvertieren</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Deal-Titel</Label>
              <Input value={titel} onChange={(e) => setTitel(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Mandant / Einheit <span className="text-danger">*</span>
              </Label>
              <Select value={firmaId} onValueChange={(v) => setFirmaId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v) => firmen.find((f) => f.id === v)?.name ?? "Wählen…"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {firmen.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Pipeline</Label>
              <Select value={pipelineId} onValueChange={(v) => setPipelineId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v) => pipelines.find((p) => p.id === v)?.name ?? "Wählen…"}
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
              <p className="text-xs text-muted-foreground">
                Start-Stage: {startStage?.name ?? "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Wert (EUR, optional)</Label>
              <Input
                value={wert}
                onChange={(e) => setWert(e.target.value)}
                inputMode="decimal"
                placeholder="z. B. 5000"
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
            <Button onClick={konvertieren} disabled={busy}>
              {busy ? "…" : "Konvertieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verwerfen */}
      <Dialog open={verwOpen} onOpenChange={setVerwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead verwerfen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>
              Grund <span className="text-danger">*</span>
            </Label>
            <Textarea
              value={grund}
              onChange={(e) => setGrund(e.target.value)}
              placeholder="Kein Bedarf, Spam, Dublette, unrealistisch…"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
            <Button variant="destructive" onClick={verwerfen} disabled={busy}>
              {busy ? "…" : "Verwerfen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
