"use client"

import * as React from "react"
import { CalendarCheck, CalendarX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/format"
import {
  BELEGUNG_QUELLE_LABELS,
  type Belegung,
  type BelegungQuelle,
} from "@/lib/belegung/verfuegbarkeit"

/**
 * Inline-Verfügbarkeitshinweis für Anlege-Dialoge (Buchung/MV): prüft [von,bis) der
 * gewählten Einheit gegen alle drei Belegungsquellen und WARNT (kein Hard-Block).
 * Debounced; rendert nichts ohne Einheit/Von.
 */
export function BelegungHinweis({
  einheitId,
  von,
  bis,
  ausser,
}: {
  einheitId: string | null | undefined
  von: string | null | undefined
  bis: string | null | undefined
  ausser?: { quelle: BelegungQuelle; id: string }
}) {
  const [res, setRes] = React.useState<{ frei: boolean; kollisionen: Belegung[] } | null>(null)

  React.useEffect(() => {
    if (!einheitId || !von) {
      setRes(null)
      return
    }
    let cancel = false
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/belegung/pruefen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ einheit_id: einheitId, von, bis: bis || null, ausser }),
        })
        if (!cancel && r.ok) setRes(await r.json())
      } catch {
        /* still */
      }
    }, 400)
    return () => {
      cancel = true
      clearTimeout(t)
    }
  }, [einheitId, von, bis, ausser])

  if (!res) return null
  if (res.frei) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-success">
        <CalendarCheck className="size-3.5" /> Einheit im Zeitraum frei.
      </p>
    )
  }
  return (
    <div className="rounded-md bg-warning/10 p-2 text-xs">
      <p className="mb-1 flex items-center gap-1.5 font-medium text-warning">
        <CalendarX className="size-3.5" /> {res.kollisionen.length} Belegungs-Kollision(en) — trotzdem anlegen möglich:
      </p>
      <ul className="flex flex-col gap-0.5">
        {res.kollisionen.map((k, i) => (
          <li key={i} className="flex items-center gap-1.5">
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
}
