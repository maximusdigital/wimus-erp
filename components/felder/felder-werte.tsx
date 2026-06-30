"use client"

import * as React from "react"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { FieldDef, FieldValue } from "@/lib/felder/types"

/**
 * Dezentrale Custom-Field-Werte je Entitäts-Detailseite (Modul 008 Stufe 2).
 * Lädt Definitionen + Werte über /api/felder/werte, rendert je `typ` das passende
 * Element (Text/Zahl/Datum/Auswahl/Mehrfachauswahl/JaNein) und speichert pro Feld
 * (idempotenter Upsert über setWert). Label ÜBER Input, Fehler UNTER Input
 * (Design-System). Keine eigene Wert-Logik — alles über die felder-Service-Schicht.
 */
type SaveState = "idle" | "saving" | "saved" | { error: string }

export function FelderWerte({ entitaet, entitaetId }: { entitaet: string; entitaetId: string }) {
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading")
  const [defs, setDefs] = React.useState<FieldDef[]>([])
  const [vals, setVals] = React.useState<Record<string, unknown>>({})
  const [save, setSave] = React.useState<Record<string, SaveState>>({})
  // Zuletzt persistierter Rohwert je Feld → Dirty-Check (kein redundanter PUT bei Blur ohne Änderung).
  const persisted = React.useRef<Record<string, unknown>>({})

  React.useEffect(() => {
    let aktiv = true
    setStatus("loading")
    fetch(`/api/felder/werte?entitaet=${entitaet}&id=${entitaetId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Laden fehlgeschlagen"))))
      .then((d: { definitionen: FieldDef[]; werte: FieldValue[] }) => {
        if (!aktiv) return
        const aktive = (d.definitionen ?? []).filter((x) => x.aktiv)
        const werteByDef = new Map((d.werte ?? []).map((w) => [w.def_id, w]))
        const initial: Record<string, unknown> = {}
        for (const def of aktive) initial[def.id] = initialWert(def, werteByDef.get(def.id))
        setDefs(aktive)
        setVals(initial)
        persisted.current = { ...initial }
        setStatus("ready")
      })
      .catch(() => aktiv && setStatus("error"))
    return () => {
      aktiv = false
    }
  }, [entitaet, entitaetId])

  const speichere = React.useCallback(
    async (def: FieldDef, roh: unknown) => {
      // Pflicht clientseitig (Server prüft zusätzlich): leer + pflicht → Fehler, kein Save.
      if (def.pflicht && istLeerRoh(roh)) {
        setSave((s) => ({ ...s, [def.id]: { error: "Pflichtfeld darf nicht leer sein." } }))
        return
      }
      // Unverändert → kein redundanter Upsert (z.B. Blur ohne Änderung).
      if (JSON.stringify(roh) === JSON.stringify(persisted.current[def.id])) return
      setSave((s) => ({ ...s, [def.id]: "saving" }))
      try {
        const r = await fetch("/api/felder/werte", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entitaet, id: entitaetId, def_id: def.id, wert: roh }),
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          setSave((s) => ({ ...s, [def.id]: { error: j.error ?? "Speichern fehlgeschlagen." } }))
          return
        }
        persisted.current[def.id] = roh
        setSave((s) => ({ ...s, [def.id]: "saved" }))
      } catch {
        setSave((s) => ({ ...s, [def.id]: { error: "Netzwerkfehler beim Speichern." } }))
      }
    },
    [entitaet, entitaetId],
  )

  const setVal = (id: string, v: unknown) => setVals((s) => ({ ...s, [id]: v }))

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }
  if (status === "error") {
    return <p className="py-4 text-sm text-danger">Felder konnten nicht geladen werden.</p>
  }
  if (defs.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Keine Felder definiert.{" "}
        <Link href="/einstellungen/felder" className="text-secondary hover:underline">
          Felder verwalten
        </Link>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {defs.map((def) => (
        <Feld
          key={def.id}
          def={def}
          wert={vals[def.id]}
          save={save[def.id] ?? "idle"}
          onChange={(v) => setVal(def.id, v)}
          onCommit={(v) => speichere(def, v)}
        />
      ))}
    </div>
  )
}

function Feld({
  def,
  wert,
  save,
  onChange,
  onCommit,
}: {
  def: FieldDef
  wert: unknown
  save: SaveState
  onChange: (v: unknown) => void
  onCommit: (v: unknown) => void
}) {
  const fehler = typeof save === "object" ? save.error : null
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" htmlFor={`feld-${def.id}`}>
        {def.label}
        {def.pflicht ? <span className="text-danger"> *</span> : null}
      </label>
      <FeldEingabe id={`feld-${def.id}`} def={def} wert={wert} onChange={onChange} onCommit={onCommit} />
      {fehler ? (
        <p className="text-xs text-danger">{fehler}</p>
      ) : save === "saved" ? (
        <p className="text-xs text-success">Gespeichert.</p>
      ) : save === "saving" ? (
        <p className="text-xs text-muted-foreground">Speichert …</p>
      ) : null}
    </div>
  )
}

function FeldEingabe({
  id,
  def,
  wert,
  onChange,
  onCommit,
}: {
  id: string
  def: FieldDef
  wert: unknown
  onChange: (v: unknown) => void
  onCommit: (v: unknown) => void
}) {
  const optionen = (def.optionen ?? []).filter((o) => o.aktiv)

  switch (def.typ) {
    case "zahl":
      return (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={(wert as string) ?? ""}
          required={def.pflicht}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
        />
      )
    case "datum":
      return (
        <Input
          id={id}
          type="date"
          value={(wert as string) ?? ""}
          required={def.pflicht}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
        />
      )
    case "janein":
      return (
        <Select
          value={wert === true ? "true" : wert === false ? "false" : ""}
          onValueChange={(v) => {
            const roh = v === "true" ? true : v === "false" ? false : ""
            onChange(roh)
            onCommit(roh)
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="–" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">–</SelectItem>
            <SelectItem value="true">Ja</SelectItem>
            <SelectItem value="false">Nein</SelectItem>
          </SelectContent>
        </Select>
      )
    case "auswahl":
      return (
        <Select
          value={(wert as string) ?? ""}
          onValueChange={(v) => {
            onChange(v)
            onCommit(v)
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Auswählen …" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">–</SelectItem>
            {optionen.map((o) => (
              <SelectItem key={o.id} value={o.opt_key}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case "mehrfachauswahl": {
      const arr = Array.isArray(wert) ? (wert as string[]) : []
      return (
        <div className="flex flex-col gap-1.5">
          {optionen.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Optionen hinterlegt.</p>
          ) : (
            optionen.map((o) => {
              const checked = arr.includes(o.opt_key)
              return (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...arr, o.opt_key]
                        : arr.filter((k) => k !== o.opt_key)
                      onChange(next)
                      onCommit(next)
                    }}
                  />
                  {o.label}
                </label>
              )
            })
          )}
        </div>
      )
    }
    case "text":
    default:
      return (
        <Input
          id={id}
          type="text"
          value={(wert as string) ?? ""}
          required={def.pflicht}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit(e.target.value)}
        />
      )
  }
}

/** UI-Rohwert aus einem geladenen FieldValue je Feldtyp. */
function initialWert(def: FieldDef, w: FieldValue | undefined): unknown {
  switch (def.typ) {
    case "zahl":
      return w?.zahl != null ? String(w.zahl) : ""
    case "datum":
      return w?.datum ?? ""
    case "janein":
      return w?.bool ?? null
    case "auswahl":
      return w?.text ?? ""
    case "mehrfachauswahl":
      return w?.optionen ?? []
    case "text":
    default:
      return w?.text ?? ""
  }
}

function istLeerRoh(roh: unknown): boolean {
  if (roh === null || roh === undefined || roh === "") return true
  if (Array.isArray(roh)) return roh.length === 0
  return false
}
