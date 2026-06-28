"use client"

import * as React from "react"

import { Timeline } from "./timeline"
import type { Aktivitaet, BezugTyp } from "@/lib/historie/types"

/**
 * Dezentraler Historie-Reiter für eine Entitäts-Detailseite. EINE Timeline-
 * Komponente (wie zentral), nur vorgefiltert + mit Ebenen-Umschalter.
 * Einbau: <HistorieTab bezugTyp="objekt" bezugId={id} hatUntergeordnete />
 */
export function HistorieTab({
  bezugTyp,
  bezugId,
  hatUntergeordnete = false,
}: {
  bezugTyp: BezugTyp
  bezugId: string
  hatUntergeordnete?: boolean
}) {
  const [inkl, setInkl] = React.useState(false)
  const [items, setItems] = React.useState<Aktivitaet[] | null>(null)

  React.useEffect(() => {
    let aktiv = true
    setItems(null)
    const url = `/api/historie?bezug_typ=${bezugTyp}&bezug_id=${bezugId}${inkl ? "&inkl=1" : ""}`
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => aktiv && setItems(d))
      .catch(() => aktiv && setItems([]))
    return () => {
      aktiv = false
    }
  }, [bezugTyp, bezugId, inkl])

  return (
    <div className="flex flex-col gap-4">
      {hatUntergeordnete ? (
        <div className="flex gap-1.5">
          <Toggle active={!inkl} onClick={() => setInkl(false)}>Nur diese Ebene</Toggle>
          <Toggle active={inkl} onClick={() => setInkl(true)}>Inkl. untergeordnete</Toggle>
        </div>
      ) : null}
      {items === null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Lädt …</p>
      ) : (
        <Timeline aktivitaeten={items} />
      )}
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
          : "rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
      }
    >
      {children}
    </button>
  )
}
