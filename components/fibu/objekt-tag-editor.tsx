"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TAG_DIMENSIONEN, tagDimensionLabel } from "@/lib/fibu/objekt-tags"

export type ObjektTagRow = { id: string; tag_typ: string; wert: string }

const TON: Record<string, string> = {
  nutzungsart: "bg-teal/10 text-teal",
  marke: "bg-secondary/10 text-secondary",
  region: "bg-primary/10 text-primary",
}

export function ObjektTagEditor({
  objektId,
  tags,
}: {
  objektId: string
  tags: ObjektTagRow[]
}) {
  const router = useRouter()
  const [adding, setAdding] = React.useState(false)
  const [typ, setTyp] = React.useState("nutzungsart")
  const [wert, setWert] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function add() {
    if (!wert.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/fibu/objekt-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objekt_id: objektId, tag_typ: typ, wert }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(res.status === 409 ? "Tag existiert bereits." : j?.error ?? "Fehlgeschlagen.")
        return
      }
      setWert("")
      setAdding(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/fibu/objekt-tags/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span
          key={t.id}
          className={`group flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${TON[t.tag_typ] ?? "bg-muted text-muted-foreground"}`}
          title={tagDimensionLabel(t.tag_typ)}
        >
          {t.wert}
          <button
            onClick={() => remove(t.id)}
            aria-label="Tag entfernen"
            className="opacity-60 hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {adding ? (
        <span className="flex items-center gap-1">
          <Select value={typ} onValueChange={(v) => setTyp(v ?? "nutzungsart")}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue>{(v) => tagDimensionLabel(String(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TAG_DIMENSIONEN.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Wert…"
            className="h-7 w-28 text-xs"
            autoFocus
          />
          <Button size="sm" className="h-7" onClick={add} disabled={busy}>
            OK
          </Button>
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setAdding(false)}>
            <X className="size-3.5" />
          </Button>
        </span>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" /> Tag
        </button>
      )}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  )
}
