"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, CalendarX, Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import {
  BELEGUNG_GRUND,
  BELEGUNG_GRUND_LABELS,
  BELEGUNG_QUELLE_LABELS,
  type Belegung,
} from "@/lib/belegung/verfuegbarkeit"

export type EinheitOption = { id: string; label: string }
export type SperreRow = {
  id: string
  einheit_id: string
  von: string
  bis: string | null
  grund: string
  notiz: string | null
  beds24_geblockt: boolean
  einheit?: { verwendungszweck_code: string | null; bezeichnung: string | null } | { verwendungszweck_code: string | null; bezeichnung: string | null }[] | null
}

function einheitLabel(s: SperreRow): string {
  const e = Array.isArray(s.einheit) ? s.einheit[0] : s.einheit
  return e?.verwendungszweck_code || e?.bezeichnung || s.einheit_id.slice(0, 8)
}

export function BelegungCockpit({
  einheiten,
  sperren,
}: {
  einheiten: EinheitOption[]
  sperren: SperreRow[]
}) {
  const router = useRouter()
  const [einheitId, setEinheitId] = React.useState(einheiten[0]?.id ?? "")
  const [von, setVon] = React.useState("")
  const [bis, setBis] = React.useState("")
  const [grund, setGrund] = React.useState<string>("renovierung")
  const [notiz, setNotiz] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ergebnis, setErgebnis] = React.useState<{ frei: boolean; kollisionen: Belegung[] } | null>(null)

  async function pruefen() {
    if (!einheitId || !von) {
      setError("Einheit + Von wählen.")
      return
    }
    setBusy(true)
    setError(null)
    setErgebnis(null)
    try {
      const res = await fetch("/api/belegung/pruefen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ einheit_id: einheitId, von, bis: bis || null }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j?.error ?? "Prüfung fehlgeschlagen.")
        return
      }
      setErgebnis(j)
    } finally {
      setBusy(false)
    }
  }

  async function sperreAnlegen() {
    if (!einheitId || !von) {
      setError("Einheit + Von wählen.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/belegung/sperren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ einheit_id: einheitId, von, bis: bis || null, grund, notiz: notiz || null }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Sperre fehlgeschlagen.")
        return
      }
      setNotiz("")
      setErgebnis(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function sperreLoeschen(id: string) {
    await fetch(`/api/belegung/sperren/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Prüfen / Sperren anlegen */}
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Einheit</span>
            <select value={einheitId} onChange={(e) => setEinheitId(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
              {einheiten.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Von *</span>
            <input type="date" value={von} onChange={(e) => setVon(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Bis (leer = offen)</span>
            <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={pruefen}>
              {busy ? <Loader2 className="animate-spin" /> : <CalendarCheck />}
              <span>Verfügbarkeit prüfen</span>
            </Button>
          </div>
        </div>

        {/* Ergebnis */}
        {ergebnis ? (
          ergebnis.frei ? (
            <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
              <CalendarCheck className="size-4" /> Frei im gewählten Zeitraum.
            </div>
          ) : (
            <div className="rounded-md bg-danger/10 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 font-medium text-danger">
                <CalendarX className="size-4" /> {ergebnis.kollisionen.length} Kollision(en) — Mensch entscheidet:
              </div>
              <ul className="flex flex-col gap-1">
                {ergebnis.kollisionen.map((k, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-[10px]">{BELEGUNG_QUELLE_LABELS[k.quelle]}</Badge>
                    <span>{k.label}</span>
                    <span className="text-muted-foreground">
                      {formatDate(k.von)} – {k.bis ? formatDate(k.bis) : "offen"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : null}

        {/* Sperre anlegen */}
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Sperrgrund</span>
            <select value={grund} onChange={(e) => setGrund(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
              {BELEGUNG_GRUND.map((g) => (
                <option key={g} value={g}>{BELEGUNG_GRUND_LABELS[g]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Notiz</span>
            <input value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="optional" className="h-9 rounded-md border bg-background px-2 text-sm" />
          </label>
          <Button type="button" disabled={busy} onClick={sperreAnlegen}>
            {busy ? <Loader2 className="animate-spin" /> : <Plus />}
            <span>Sperre anlegen</span>
          </Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      {/* Sperren-Liste */}
      <div>
        <p className="mb-2 text-sm font-medium">Sperren ({sperren.length})</p>
        {sperren.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Keine Sperren.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Einheit</th>
                  <th className="p-2">Zeitraum</th>
                  <th className="p-2">Grund</th>
                  <th className="p-2">Notiz</th>
                  <th className="p-2">Beds24</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {sperren.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{einheitLabel(s)}</td>
                    <td className="whitespace-nowrap p-2 text-xs">
                      {formatDate(s.von)} – {s.bis ? formatDate(s.bis) : "offen"}
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-[10px]">{BELEGUNG_GRUND_LABELS[s.grund] ?? s.grund}</Badge>
                    </td>
                    <td className="max-w-[16rem] truncate p-2 text-xs text-muted-foreground">{s.notiz ?? "—"}</td>
                    <td className="p-2">
                      <span className={cn("text-xs", s.beds24_geblockt ? "text-success" : "text-muted-foreground")}>
                        {s.beds24_geblockt ? "geblockt" : "offen"}
                      </span>
                    </td>
                    <td className="p-2">
                      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-danger" aria-label="Löschen" onClick={() => sperreLoeschen(s.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
