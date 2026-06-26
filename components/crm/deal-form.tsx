"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

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
import { CustomFieldInputs } from "@/components/crm/custom-field-inputs"
import { neuFormularFelder } from "@/lib/crm/deal"
import type {
  CustomFieldDefinition,
  FirmaRef,
  KontaktRef,
  OrganisationRef,
  Pipeline,
  PipelineStage,
} from "@/types/crm"

const KEINE = "__keine__"
type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

export function DealForm({
  firmen,
  pipelines,
  kontakte,
  organisationen,
  customFields,
  pipelineVorauswahl,
}: {
  firmen: FirmaRef[]
  pipelines: PipelineMitStages[]
  kontakte: KontaktRef[]
  organisationen: OrganisationRef[]
  customFields: CustomFieldDefinition[]
  pipelineVorauswahl?: string
}) {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const [titel, setTitel] = React.useState("")
  const [firmaId, setFirmaId] = React.useState(firmen[0]?.id ?? "")
  const [pipelineId, setPipelineId] = React.useState(
    pipelineVorauswahl ??
      pipelines.find((p) => p.default_pipeline)?.id ??
      pipelines[0]?.id ??
      ""
  )
  const [stageId, setStageId] = React.useState("")
  const [kontaktId, setKontaktId] = React.useState(KEINE)
  const [orgId, setOrgId] = React.useState(KEINE)
  const [wert, setWert] = React.useState("")
  const [datum, setDatum] = React.useState("")
  const [custom, setCustom] = React.useState<Record<string, unknown>>({})

  const stages = React.useMemo(
    () =>
      [...(pipelines.find((p) => p.id === pipelineId)?.stages ?? [])].sort(
        (a, b) => a.sortierung - b.sortierung
      ),
    [pipelines, pipelineId]
  )

  React.useEffect(() => {
    if (stages.length > 0 && !stages.some((s) => s.id === stageId)) {
      setStageId(stages[0].id)
    }
  }, [stages, stageId])

  const felder = neuFormularFelder(customFields, { entitaet: "deal", pipelineId })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!firmaId) {
      setError("Mandant/Einheit ist Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel,
          firma_id: firmaId,
          pipeline_id: pipelineId,
          stage_id: stageId,
          kontakt_id: kontaktId === KEINE ? null : kontaktId,
          organisation_id: orgId === KEINE ? null : orgId,
          wert: wert || null,
          erwartetes_abschluss_datum: datum || null,
          custom_values: custom,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Speichern fehlgeschlagen.")
        return
      }
      const j = await res.json()
      router.push(`/crm/deals/${j.id}`)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-[720px] flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>
          Titel <span className="text-danger">*</span>
        </Label>
        <Input value={titel} onChange={(e) => setTitel(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Start-Stage</Label>
          <Select value={stageId} onValueChange={(v) => setStageId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v) => stages.find((s) => s.id === v)?.name ?? "Wählen…"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Wert (EUR)</Label>
          <Input
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            inputMode="decimal"
            placeholder="z. B. 5000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Kontakt</Label>
          <Select value={kontaktId} onValueChange={(v) => setKontaktId(v ?? KEINE)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v) =>
                  v === KEINE
                    ? "—"
                    : (() => {
                        const k = kontakte.find((x) => x.id === v)
                        return k ? [k.vorname, k.nachname].filter(Boolean).join(" ") : "—"
                      })()
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KEINE}>—</SelectItem>
              {kontakte.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {[k.vorname, k.nachname].filter(Boolean).join(" ") || k.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Organisation</Label>
          <Select value={orgId} onValueChange={(v) => setOrgId(v ?? KEINE)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v) => (v === KEINE ? "—" : organisationen.find((o) => o.id === v)?.name ?? "—")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KEINE}>—</SelectItem>
              {organisationen.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Erwartetes Abschlussdatum</Label>
          <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
      </div>

      {felder.length > 0 ? (
        <div className="flex flex-col gap-3 border-t pt-4">
          <p className="text-sm font-medium">Weitere Felder</p>
          <CustomFieldInputs
            felder={felder}
            values={custom}
            onChange={(id, v) => setCustom((c) => ({ ...c, [id]: v }))}
          />
        </div>
      ) : null}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/crm")}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "Deal anlegen"}
        </Button>
      </div>
    </form>
  )
}
