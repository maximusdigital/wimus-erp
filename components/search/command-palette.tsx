"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search } from "lucide-react"

import { SEARCH_CONFIG } from "@/lib/search/config"
import type { SearchResult } from "@/lib/search/types"

/**
 * Globale Suche (⌘K / Strg-K), modulübergreifend. Debounced Fan-out gegen
 * /api/search (RLS-konform), gruppiert nach Entität, Sprung zum Treffer.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [aktiv, setAktiv] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // ⌘K / Strg-K öffnet/schließt.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("wimus:open-search", onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("wimus:open-search", onOpen)
    }
  }, [])

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    else {
      setQ("")
      setResults([])
      setAktiv(0)
    }
  }, [open])

  // Debounced Suche.
  React.useEffect(() => {
    const text = q.trim()
    if (text.length < SEARCH_CONFIG.minQueryLength) {
      setResults([])
      return
    }
    let cancel = false
    setBusy(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(text)}`)
        const j = (await res.json()) as SearchResult[]
        if (!cancel) {
          setResults(Array.isArray(j) ? j : [])
          setAktiv(0)
        }
      } finally {
        if (!cancel) setBusy(false)
      }
    }, SEARCH_CONFIG.debounceMs)
    return () => {
      cancel = true
      clearTimeout(t)
    }
  }, [q])

  function springe(r: SearchResult) {
    setOpen(false)
    router.push(r.route)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setAktiv((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setAktiv((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && results[aktiv]) {
      e.preventDefault()
      springe(results[aktiv])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-lg border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-3">
          {busy ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : <Search className="size-4 shrink-0 text-muted-foreground" />}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Suchen… (Mieter, Objekt, Einheit, Vorgang, Buchung)"
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
          <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {q.trim().length < SEARCH_CONFIG.minQueryLength ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Mindestens {SEARCH_CONFIG.minQueryLength} Zeichen…</p>
          ) : results.length === 0 && !busy ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Keine Treffer.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.entityKey}-${r.id}`}
                onMouseEnter={() => setAktiv(i)}
                onClick={() => springe(r)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${i === aktiv ? "bg-secondary/10" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.title}</span>
                  {r.subtitle ? <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span> : null}
                </span>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{r.entityLabel}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
