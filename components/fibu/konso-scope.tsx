"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bookmark, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Scope = { id: string; name: string; einheiten_set: string[] }

function ladeHref(einheiten: string[], von: string, bis: string): string {
  const qs = einheiten.map((id) => `f=${id}`).join("&")
  return `/fibu/konsolidierung?${qs}&von=${von}&bis=${bis}`
}

export function KonsoScopeLeiste({
  scopes,
  selektion,
  von,
  bis,
}: {
  scopes: Scope[]
  selektion: string[]
  von: string
  bis: string
}) {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function speichern() {
    if (!name.trim()) {
      setError("Name ist Pflicht.")
      return
    }
    if (selektion.length === 0) {
      setError("Erst Einheiten auswählen und konsolidieren.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/fibu/auswertungs-scopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, einheiten_set: selektion }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Speichern fehlgeschlagen.")
        return
      }
      setName("")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function loeschen(id: string) {
    await fetch(`/api/fibu/auswertungs-scopes/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Bookmark className="size-4" /> Presets
        </span>
        {scopes.length === 0 ? (
          <span className="text-sm text-muted-foreground">– keine gespeichert –</span>
        ) : (
          scopes.map((s) => (
            <span key={s.id} className="flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm">
              <button
                onClick={() => router.push(ladeHref(s.einheiten_set, von, bis))}
                className="hover:underline"
              >
                {s.name}{" "}
                <span className="text-xs text-muted-foreground">({s.einheiten_set.length})</span>
              </button>
              <button
                onClick={() => loeschen(s.id)}
                aria-label="Preset löschen"
                className="rounded-full p-0.5 text-muted-foreground hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex items-end gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aktuelle Auswahl als Preset speichern…"
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={speichern} disabled={busy}>
          <Save className="size-4" /> Speichern
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  )
}
