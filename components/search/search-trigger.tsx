"use client"

import { Search } from "lucide-react"

/** Header-Button, der die globale Command-Palette öffnet (⌘K / Klick). */
export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("wimus:open-search"))}
      className="flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground shadow-xs outline-none hover:bg-muted/50"
      aria-label="Globale Suche öffnen"
    >
      <Search className="size-4 shrink-0" />
      <span>Suchen…</span>
      <kbd className="ml-auto hidden rounded border px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
    </button>
  )
}
