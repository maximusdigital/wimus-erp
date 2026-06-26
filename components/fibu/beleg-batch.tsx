"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCheck, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Bucht alle freigebbaren Entwürfe (Soll-Konto gesetzt, kein Defekt) als Batch. */
export function BelegBatchFreigeben({ ids }: { ids: string[] }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setRunning(true)
    setError(null)
    setDone(0)
    let ok = 0
    for (const id of ids) {
      const res = await fetch(`/api/fibu/belege/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "freigeben" }),
      })
      if (res.ok) ok++
      setDone(ok)
    }
    setRunning(false)
    if (ok < ids.length) setError(`${ids.length - ok} nicht gebucht (Konflikt/Fehler).`)
    router.refresh()
  }

  if (ids.length === 0) return null

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={running} variant="outline">
        {running ? <Loader2 className="animate-spin" /> : <CheckCheck />}
        <span>
          {running
            ? `Buche… (${done}/${ids.length})`
            : `Freigebbare buchen (${ids.length})`}
        </span>
      </Button>
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </div>
  )
}
