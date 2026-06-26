"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"

export function BelegAktionen({
  id,
  freigebbar,
}: {
  id: string
  freigebbar: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<"freigeben" | "ablehnen" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(action: "freigeben" | "ablehnen") {
    setLoading(action)
    setError(null)
    const res = await fetch(`/api/fibu/belege/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setLoading(null)
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Aktion fehlgeschlagen")
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={!freigebbar || loading !== null}
          onClick={() => run("freigeben")}
          title={freigebbar ? "Buchen" : "Erst kontieren"}
        >
          <Check />
          <span>{loading === "freigeben" ? "…" : "Buchen"}</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          disabled={loading !== null}
          onClick={() => run("ablehnen")}
          aria-label="Ablehnen"
        >
          <X className="text-danger" />
        </Button>
      </div>
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </div>
  )
}
