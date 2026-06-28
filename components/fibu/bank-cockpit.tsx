"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Check, Ban } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate, formatEUR } from "@/lib/utils/format"
import {
  BANK_STATUS_CLASS,
  BANK_STATUS_LABELS,
  type BankKonto,
  type BankUmsatzRow,
  type VertragOption,
} from "@/types/bank"

type ImportSummary = {
  gesamt: number
  importiert: number
  dubletten: number
  ignoriert: number
  auto: number
  pruefen: number
  klaeren: number
  fehler: string[]
}

const FILTER = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Klären" },
  { key: "zugeordnet", label: "Zugeordnet" },
  { key: "manuell", label: "Manuell" },
  { key: "ignoriert", label: "Ignoriert" },
] as const

export function BankCockpit({
  umsaetze,
  konten,
  vertraege,
}: {
  umsaetze: BankUmsatzRow[]
  konten: BankKonto[]
  vertraege: VertragOption[]
}) {
  const router = useRouter()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [kontoId, setKontoId] = React.useState<string>(konten[0]?.id ?? "")
  const [busy, setBusy] = React.useState(false)
  const [summary, setSummary] = React.useState<ImportSummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<string>("offen")
  const [rowBusy, setRowBusy] = React.useState<string | null>(null)
  const [wahl, setWahl] = React.useState<Record<string, string>>({})

  async function importieren(file: File) {
    setBusy(true)
    setError(null)
    setSummary(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (kontoId) fd.append("bank_konto_id", kontoId)
      const res = await fetch("/api/fibu/bank/import", { method: "POST", body: fd })
      const j = await res.json().catch(() => null)
      if (!res.ok) {
        setError(j?.error ?? "Import fehlgeschlagen.")
        return
      }
      setSummary(j as ImportSummary)
      router.refresh()
    } catch {
      setError("Import fehlgeschlagen.")
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function zuordnen(id: string, body: Record<string, unknown>) {
    setRowBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/fibu/bank/umsaetze/${id}/zuordnen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Zuordnung fehlgeschlagen.")
        return
      }
      router.refresh()
    } finally {
      setRowBusy(null)
    }
  }

  const gefiltert = umsaetze.filter((u) => filter === "alle" || u.zuordnung_status === filter)

  return (
    <div className="flex flex-col gap-4">
      {/* Import */}
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Bankkonto</label>
            <select
              value={kontoId}
              onChange={(e) => setKontoId(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">— ohne Konto —</option>
              {konten.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.bezeichnung}
                </option>
              ))}
            </select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importieren(f)
            }}
          />
          <Button disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            <span>{busy ? "Importiere…" : "KSK/WISO-CSV importieren"}</span>
          </Button>
          <span className="text-xs text-muted-foreground">CP1252, Trennzeichen „;" (KSK Ludwigsburg)</span>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {summary ? (
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <span className="font-medium">{summary.importiert}</span> importiert ·{" "}
            {summary.auto} auto-zugeordnet · {summary.pruefen} prüfen · {summary.klaeren} klären ·{" "}
            {summary.ignoriert} ignoriert · {summary.dubletten} Dubletten übersprungen
            {summary.fehler.length > 0 ? (
              <span className="ml-1 text-danger">· {summary.fehler.length} Fehler</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTER.map((f) => {
          const n = umsaetze.filter((u) => f.key === "alle" || u.zuordnung_status === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === f.key ? "bg-secondary/10 text-secondary" : "text-muted-foreground"
              )}
            >
              {f.label} <span className="text-xs">({n})</span>
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {gefiltert.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Umsätze in dieser Ansicht.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-2">Datum</th>
                <th className="p-2">Empfänger / Zweck</th>
                <th className="p-2 text-right">Betrag</th>
                <th className="p-2">Bezug</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((u) => {
                const offen = ["offen", "teilweise"].includes(u.zuordnung_status)
                const bezug =
                  u.erkanntes_k1 ||
                  u.einheit?.verwendungszweck_code ||
                  u.objekt?.kuerzel ||
                  "—"
                return (
                  <tr key={u.id} className="border-b last:border-0 align-top">
                    <td className="whitespace-nowrap p-2 text-xs">{formatDate(u.wertstellung)}</td>
                    <td className="p-2">
                      <div className="font-medium">{u.empfaenger || "—"}</div>
                      <div className="max-w-[24rem] truncate text-xs text-muted-foreground">
                        {u.verwendungszweck}
                      </div>
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap p-2 text-right tabular-nums font-medium",
                        u.richtung === "ausgabe" ? "text-danger" : "text-success"
                      )}
                    >
                      {formatEUR(u.betrag)}
                    </td>
                    <td className="p-2 text-xs">{bezug}</td>
                    <td className="p-2">
                      <Badge className={cn("text-[10px]", BANK_STATUS_CLASS[u.zuordnung_status])}>
                        {BANK_STATUS_LABELS[u.zuordnung_status] ?? u.zuordnung_status}
                        {u.match_confidence != null ? ` ${Math.round(u.match_confidence * 100)}%` : ""}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {offen ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={wahl[u.id] ?? u.mietvertrag_id ?? ""}
                            onChange={(e) => setWahl((w) => ({ ...w, [u.id]: e.target.value }))}
                            className="h-8 max-w-[12rem] rounded-md border bg-background px-1 text-xs"
                          >
                            <option value="">Vertrag wählen…</option>
                            {vertraege.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            disabled={rowBusy === u.id || !(wahl[u.id] ?? u.mietvertrag_id)}
                            aria-label="Zuordnen"
                            onClick={() => zuordnen(u.id, { mietvertrag_id: wahl[u.id] ?? u.mietvertrag_id })}
                          >
                            {rowBusy === u.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground"
                            disabled={rowBusy === u.id}
                            aria-label="Ignorieren"
                            onClick={() => zuordnen(u.id, { ignorieren: true })}
                          >
                            <Ban className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {u.match_methode ? `via ${u.match_methode}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
