/**
 * Globale Suche (Modul 006) – Fan-out über die Registry, Zusammenführung + Ranking.
 * Pro `inGlobalSearch`-Entität eine schlanke, RLS-gefilterte Trigram/ILIKE-Query
 * (Limit je Entität); Ergebnisse app-seitig nach `score × globalWeight` gemischt.
 * KEINE Service-Role — die normale Server-Client-Schicht trägt RLS.
 */
import type { createServerClient } from "@/lib/supabase/server"
import { SEARCH_CONFIG } from "./config"
import { globalEntities } from "./registry"
import { applyOps, buildQueryOps } from "./query-builder"
import type { SearchEntity, SearchResult } from "./types"

type ServerClient = Awaited<ReturnType<typeof createServerClient>>

function firstNonEmpty(row: Record<string, unknown>, fields: string[]): string | undefined {
  for (const f of fields) {
    const v = row[f]
    if (v != null && String(v).trim() !== "") return String(v)
  }
  return undefined
}

function route(entity: SearchEntity, id: string): string {
  return entity.routePattern.replace("{id}", id)
}

/**
 * REIN: führt Treffer aller Entitäten zusammen und sortiert nach Score (absteigend),
 * kappt auf das Gesamt-Limit.
 */
export function mergeAndRank(
  perEntity: SearchResult[][],
  limit: number = SEARCH_CONFIG.globalLimit
): SearchResult[] {
  return perEntity
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Fan-out-Suche über alle globalen Entitäten (RLS-konform). */
export async function globaleSuche(
  supabase: ServerClient,
  text: string
): Promise<SearchResult[]> {
  const q = text.trim()
  if (q.length < SEARCH_CONFIG.minQueryLength) return []

  const perEntity = await Promise.all(
    globalEntities().map(async (e): Promise<SearchResult[]> => {
      const ops = buildQueryOps(e, { suchtext: q })
      if (ops.length === 0) return []
      const cols = [...new Set(["id", ...e.titleFields, ...(e.subtitleFields ?? [])])].join(", ")
      const base = supabase
        .schema("wimus")
        .from(e.table)
        .select(cols)
        .limit(SEARCH_CONFIG.perEntityLimit)
      const { data, error } = await applyOps(base, ops)
      if (error || !data) return []
      return (data as unknown as Record<string, unknown>[]).map((row) => {
        const title = firstNonEmpty(row, e.titleFields) ?? e.labelSingular
        const startsWith = title.toLowerCase().startsWith(q.toLowerCase())
        return {
          entityKey: e.key,
          entityLabel: e.labelSingular,
          id: String(row.id),
          title,
          subtitle: firstNonEmpty(row, e.subtitleFields ?? []) ?? null,
          route: route(e, String(row.id)),
          // Ohne similarity() (Roadmap): Gewicht + Bonus für Präfix-Treffer.
          score: e.globalWeight + (startsWith ? 0.5 : 0),
        }
      })
    })
  )

  return mergeAndRank(perEntity)
}
