"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatDate, formatEUR } from "@/lib/utils/format"

export type FeststellungPayload = {
  firma_id: string
  periode_von: string
  periode_bis: string
  ermitteltes_ergebnis: number
  verteilung: { gesellschafter_id: string; name?: string | null; effektiv_quote: number; anteil_betrag: number }[]
}

export function FeststellungSpeichern({ payload }: { payload: FeststellungPayload }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function speichern() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/fibu/feststellungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Speichern fehlgeschlagen.")
        return
      }
      setSaved(true)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={speichern} disabled={busy || saved}>
        {saved ? <Check className="size-4 text-success" /> : <Save className="size-4" />}
        <span>{saved ? "Gespeichert" : "Feststellung speichern"}</span>
      </Button>
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </div>
  )
}

export type FeststellungEintrag = {
  id: string
  firma_id: string
  periode_von: string
  periode_bis: string
  ermitteltes_ergebnis: number | null
  created_at: string
  firma?: { name: string; kuerzel: string | null } | null
}

export function FeststellungHistorie({ eintraege }: { eintraege: FeststellungEintrag[] }) {
  const router = useRouter()

  async function loeschen(id: string) {
    await fetch(`/api/fibu/feststellungen/${id}`, { method: "DELETE" })
    router.refresh()
  }

  if (eintraege.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine gespeicherten Feststellungen.</p>
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {eintraege.map((e) => {
        const ladeHref = `/fibu/feststellung?firma_id=${e.firma_id}&von=${e.periode_von}&bis=${e.periode_bis}&ergebnis=${e.ermitteltes_ergebnis ?? 0}`
        return (
          <li key={e.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="flex-1">
              <span className="font-medium">{e.firma?.kuerzel || e.firma?.name || "—"}</span>{" "}
              <span className="text-muted-foreground">
                {e.periode_von} – {e.periode_bis}
              </span>
            </div>
            <span className="tabular-nums">{formatEUR(e.ermitteltes_ergebnis)}</span>
            <span className="hidden w-24 text-right text-xs text-muted-foreground sm:inline">
              {formatDate(e.created_at)}
            </span>
            <Button size="sm" variant="ghost" render={<Link href={ladeHref} />}>
              Laden
            </Button>
            <button
              onClick={() => loeschen(e.id)}
              aria-label="Löschen"
              className="text-muted-foreground hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
