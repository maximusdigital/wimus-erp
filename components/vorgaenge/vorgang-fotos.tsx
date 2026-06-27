"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FotoRow = {
  id: string
  phase: string
  url: string | null
  beschreibung: string | null
  aufgenommen_am: string
}

const PHASEN = [
  { value: "vorher", label: "Vorher" },
  { value: "nachher", label: "Nachher" },
  { value: "befund", label: "Befund" },
] as const

/** Bild client-seitig auf max. 1600px verkleinern (mobile-freundlich, kleiner Upload). */
function downscale(file: File, max = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas nicht verfügbar."))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function VorgangFotos({ vorgangId, fotos }: { vorgangId: string; fotos: FotoRow[] }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [phase, setPhase] = React.useState<string>("vorher")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [gross, setGross] = React.useState<string | null>(null)

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      for (const file of files) {
        const dataUrl = await downscale(file)
        const res = await fetch(`/api/vorgaenge/${vorgangId}/foto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase, dataUrl }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => null)
          setError(j?.error ?? "Upload fehlgeschlagen.")
          break
        }
      }
      router.refresh()
    } catch {
      setError("Bild konnte nicht verarbeitet werden.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function del(id: string) {
    await fetch(`/api/ops/foto/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Capture-Leiste (mobile-first, große Touch-Ziele) */}
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="flex overflow-hidden rounded-md border">
          {PHASEN.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPhase(p.value)}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium",
                phase === p.value ? "bg-secondary/10 text-secondary" : "text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button type="button" size="lg" className="h-12" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <Camera />}
          <span>{busy ? "Lädt…" : `Foto aufnehmen / wählen (${PHASEN.find((p) => p.value === phase)?.label})`}</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onFiles}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      {/* Galerie je Phase */}
      {PHASEN.map((p) => {
        const items = fotos.filter((f) => f.phase === p.value)
        if (items.length === 0) return null
        return (
          <div key={p.value}>
            <p className="mb-2 text-sm font-medium">{p.label}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((f) => (
                <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  {f.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.url}
                      alt={f.beschreibung ?? p.label}
                      className="size-full cursor-zoom-in object-cover"
                      onClick={() => setGross(f.url)}
                    />
                  ) : null}
                  <button
                    onClick={() => del(f.id)}
                    aria-label="Foto löschen"
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {fotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Fotos.</p>
      ) : null}

      {/* Vollbild-Lightbox */}
      {gross ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setGross(null)}
        >
          <button className="absolute right-4 top-4 text-white" aria-label="Schließen">
            <X />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gross} alt="Foto" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      ) : null}
    </div>
  )
}
