"use client"

import * as React from "react"
import {
  Banknote, AlertTriangle, Send, Inbox, FileText, FileX, AlertOctagon,
  KeyRound, CalendarOff, CalendarCheck, Receipt, Zap, CircleDot,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  aktivitaetFarbe, aktivitaetIcon, gruppiereFeed, type StilFarbe,
} from "@/lib/historie/stil"
import type { Aktivitaet } from "@/lib/historie/types"

const ICONS: Record<string, LucideIcon> = {
  banknote: Banknote, "alert-triangle": AlertTriangle, send: Send, inbox: Inbox,
  "file-text": FileText, "file-x": FileX, "alert-octagon": AlertOctagon,
  "key-round": KeyRound, "calendar-off": CalendarOff, "calendar-check": CalendarCheck,
  receipt: Receipt, zap: Zap, "circle-dot": CircleDot,
}

// Design-Tokens (literal, purge-safe).
const FARBE: Record<StilFarbe, { dot: string; ring: string }> = {
  success: { dot: "bg-success/10 text-success", ring: "ring-success/20" },
  danger: { dot: "bg-danger/10 text-danger", ring: "ring-danger/20" },
  warning: { dot: "bg-warning/10 text-warning", ring: "ring-warning/20" },
  secondary: { dot: "bg-secondary/10 text-secondary", ring: "ring-secondary/20" },
  teal: { dot: "bg-teal/10 text-teal", ring: "ring-teal/20" },
  muted: { dot: "bg-muted text-muted-foreground", ring: "ring-border" },
}

function fmtZeit(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
}

export function Timeline({ aktivitaeten }: { aktivitaeten: Aktivitaet[] }) {
  // Filter-State (Modul). „jetzt" stabil pro Mount (Hydration-sicher).
  const [jetzt] = React.useState(() => new Date())
  const [modul, setModul] = React.useState<string | null>(null)

  const module = React.useMemo(
    () => Array.from(new Set(aktivitaeten.map((a) => a.modul))).sort(),
    [aktivitaeten],
  )
  const gefiltert = modul ? aktivitaeten.filter((a) => a.modul === modul) : aktivitaeten
  const gruppen = gruppiereFeed(gefiltert, jetzt)

  if (aktivitaeten.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Aktivitäten.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {module.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={modul === null} onClick={() => setModul(null)}>Alle</FilterChip>
          {module.map((m) => (
            <FilterChip key={m} active={modul === m} onClick={() => setModul(m)}>{m}</FilterChip>
          ))}
        </div>
      ) : null}

      {gruppen.map((g) => (
        <div key={g.gruppe} className="flex flex-col gap-1">
          <div className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</div>
          <ol className="relative ml-3 border-l border-border">
            {g.items.map((a) => (
              <TimelineItem key={a.id} a={a} zeit={fmtZeit(a.zeitpunkt)} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

function TimelineItem({ a, zeit }: { a: Aktivitaet; zeit: string }) {
  const [offen, setOffen] = React.useState(false)
  const Icon = ICONS[aktivitaetIcon(a)] ?? CircleDot
  const farbe = FARBE[aktivitaetFarbe(a)]
  const hatDetail = !!a.beschreibung || (a.payload && Object.keys(a.payload).length > 0)

  return (
    <li className="mb-3 ml-6">
      <span
        className={`absolute -left-3 flex size-6 items-center justify-center rounded-full ring-4 ring-background ${farbe.dot}`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="rounded-lg border bg-card px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => hatDetail && setOffen((o) => !o)}
            className={`text-left text-sm font-medium ${hatDetail ? "cursor-pointer hover:underline" : "cursor-default"}`}
          >
            {a.titel}
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="font-normal">{a.modul}</Badge>
            <span className="text-xs text-muted-foreground">{zeit}</span>
          </div>
        </div>
        {offen && hatDetail ? (
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            {a.beschreibung ? <p>{a.beschreibung}</p> : null}
            {a.payload && Object.keys(a.payload).length > 0 ? (
              <pre className="overflow-x-auto rounded bg-muted p-2 font-mono">
                {JSON.stringify(a.payload, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
          : "rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
      }
    >
      {children}
    </button>
  )
}
