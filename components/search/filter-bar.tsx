"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { getEntity } from "@/lib/search/registry"
import { SEARCH_CONFIG } from "@/lib/search/config"

/**
 * Pro-Modul Such-/Filterleiste (Modul 006). Liest/schreibt den Filter-Zustand in
 * die URL-Query (teilbar/bookmarkbar); die Modul-Liste (Server-Component) liest
 * dieselben Params und filtert RLS-konform über die geteilte Engine.
 *
 * Konfiguration kommt aus der Registry (`filterFields` der Entität) — kein Modul-Code.
 */
export function FilterBar({ entityKey }: { entityKey: string }) {
  const entity = getEntity(entityKey)
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [q, setQ] = React.useState(params.get("q") ?? "")

  const setParam = React.useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  // Debounced Freitext → ?q=
  React.useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParam("q", q.trim())
    }, SEARCH_CONFIG.debounceMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  if (!entity) return null
  const enumFields = (entity.filterFields ?? []).filter((f) => f.type === "enum")
  const aktiv = enumFields.some((f) => params.get(f.column)) || (params.get("q") ?? "")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex h-9 min-w-[12rem] flex-1 items-center gap-2 rounded-md border bg-background px-2 sm:max-w-xs">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      {enumFields.map((f) => (
        <select
          key={f.column}
          value={params.get(f.column) ?? ""}
          onChange={(e) => setParam(f.column, e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">{f.label}: alle</option>
          {(f.optionen ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      {aktiv ? (
        <button
          type="button"
          onClick={() => {
            setQ("")
            router.replace(pathname, { scroll: false })
          }}
          className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" /> Zurücksetzen
        </button>
      ) : null}
    </div>
  )
}
