"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Eskalations-Steuerung am Vorgang-Detail. `computed` = rechnerisch fällig
 * (Notfall/überfällig); `manuell` = persistiertes eskaliert-Flag.
 */
export function VorgangEskalation({
  vorgangId,
  manuell,
  computed,
  grund,
}: {
  vorgangId: string
  manuell: boolean
  computed: boolean
  grund: "notfall" | "ueberfaellig" | null
}) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  async function setze(eskaliert: boolean) {
    setBusy(true)
    await fetch(`/api/vorgaenge/${vorgangId}/eskalation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eskaliert }),
    })
    setBusy(false)
    router.refresh()
  }

  const aktiv = manuell || computed
  const grundText =
    grund === "notfall" ? "Notfall" : grund === "ueberfaellig" ? "überfällig" : null

  return (
    <div className="flex items-center gap-2">
      {aktiv ? (
        <span className="flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger">
          <AlertTriangle className="size-4" />
          Eskaliert{grundText ? ` · ${grundText}` : ""}
        </span>
      ) : null}
      {manuell ? (
        <Button size="sm" variant="ghost" onClick={() => setze(false)} disabled={busy}>
          <ShieldCheck className="size-4" /> Aufheben
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setze(true)} disabled={busy}>
          <AlertTriangle className="size-4" /> Eskalieren
        </Button>
      )}
    </div>
  )
}
