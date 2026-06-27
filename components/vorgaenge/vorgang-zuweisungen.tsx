"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, User, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ZuweisungRow = {
  id: string
  rolle: string
  status: string
  akteur_id: string | null
  organisation_id: string | null
  kontakt_id: string | null
  akteur?: { name: string } | null
  organisation?: { name: string } | null
}
type Opt = { id: string; name: string }

const STATUS_NEXT: Record<string, string | null> = {
  vorgeschlagen: "beauftragt",
  beauftragt: "angenommen",
  angenommen: "erledigt",
  erledigt: null,
  abgelehnt: null,
}
const STATUS_LABEL: Record<string, string> = {
  vorgeschlagen: "Vorgeschlagen",
  beauftragt: "Beauftragt",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  erledigt: "Erledigt",
}
const KEIN = "__kein__"

export function VorgangZuweisungen({
  vorgangId,
  zuweisungen,
  akteure,
  organisationen,
}: {
  vorgangId: string
  zuweisungen: ZuweisungRow[]
  akteure: Opt[]
  organisationen: Opt[]
}) {
  const router = useRouter()
  const [modus, setModus] = React.useState<"intern" | "extern">("intern")
  const [akteurId, setAkteurId] = React.useState(KEIN)
  const [orgId, setOrgId] = React.useState(KEIN)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function add() {
    const body =
      modus === "intern"
        ? { rolle: "ausfuehrend", akteur_id: akteurId === KEIN ? null : akteurId }
        : { rolle: "extern", organisation_id: orgId === KEIN ? null : orgId }
    if ((modus === "intern" && akteurId === KEIN) || (modus === "extern" && orgId === KEIN)) {
      setError("Bitte auswählen.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/vorgaenge/${vorgangId}/zuweisung`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (res.ok) {
      setAkteurId(KEIN)
      setOrgId(KEIN)
      router.refresh()
    } else {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Fehlgeschlagen.")
    }
  }

  async function advance(z: ZuweisungRow) {
    const next = STATUS_NEXT[z.status]
    if (!next) return
    await fetch(`/api/ops/zuweisung/${z.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    router.refresh()
  }

  async function del(id: string) {
    await fetch(`/api/ops/zuweisung/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y rounded-lg border">
        {zuweisungen.length === 0 ? (
          <li className="p-3 text-center text-sm text-muted-foreground">Keine Zuweisungen</li>
        ) : (
          zuweisungen.map((z) => {
            const extern = !z.akteur_id
            const name = z.akteur?.name || z.organisation?.name || "—"
            const next = STATUS_NEXT[z.status]
            return (
              <li key={z.id} className="flex items-center gap-2 p-3 text-sm">
                {extern ? <Building2 className="size-4 text-muted-foreground" /> : <User className="size-4 text-muted-foreground" />}
                <span className="flex-1 font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">{z.rolle}</span>
                <StatusBadge status={z.status === "abgelehnt" ? "abgelehnt" : z.status === "erledigt" ? "erledigt" : "offen"}>
                  {STATUS_LABEL[z.status] ?? z.status}
                </StatusBadge>
                {next ? (
                  <Button size="sm" variant="ghost" onClick={() => advance(z)}>
                    → {STATUS_LABEL[next]}
                  </Button>
                ) : null}
                <button onClick={() => del(z.id)} aria-label="Entfernen" className="text-muted-foreground hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })
        )}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex overflow-hidden rounded-md border text-sm">
          <button
            type="button"
            onClick={() => setModus("intern")}
            className={modus === "intern" ? "bg-secondary/10 px-2.5 py-1.5 text-secondary" : "px-2.5 py-1.5 text-muted-foreground"}
          >
            Intern
          </button>
          <button
            type="button"
            onClick={() => setModus("extern")}
            className={modus === "extern" ? "border-l bg-secondary/10 px-2.5 py-1.5 text-secondary" : "border-l px-2.5 py-1.5 text-muted-foreground"}
          >
            Extern
          </button>
        </div>
        {modus === "intern" ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Akteur</Label>
            <Select value={akteurId} onValueChange={(v) => setAkteurId(v ?? KEIN)}>
              <SelectTrigger className="w-52">
                <SelectValue>{(v) => (v === KEIN ? "Wählen…" : akteure.find((a) => a.id === v)?.name ?? "—")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEIN}>Wählen…</SelectItem>
                {akteure.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Organisation</Label>
            <Select value={orgId} onValueChange={(v) => setOrgId(v ?? KEIN)}>
              <SelectTrigger className="w-52">
                <SelectValue>{(v) => (v === KEIN ? "Wählen…" : organisationen.find((o) => o.id === v)?.name ?? "—")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEIN}>Wählen…</SelectItem>
                {organisationen.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button size="sm" onClick={add} disabled={busy}>
          <Plus className="size-4" /> Zuweisen
        </Button>
        {error ? <span className="text-sm text-danger">{error}</span> : null}
      </div>
    </div>
  )
}
