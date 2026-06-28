/** Such-/Filter-Schicht (Modul 006) – gemeinsame Typen. */

export type FilterFieldType = "text" | "enum" | "date" | "number" | "bool"

export type FilterField = {
  column: string
  label: string
  type: FilterFieldType
  optionen?: { value: string; label: string }[] // für enum
}

export type SearchEntity = {
  key: string
  table: string
  labelSingular: string
  routePattern: string // z.B. "/objekte/{id}"
  tenantColumn: string // RLS-Spalte (mandant_id) – Doku/Prüfbarkeit; RLS greift in der DB
  trigramFields: string[] // fuzzy/Teilstring (gin_trgm_ops-Indizes)
  /** Felder, aus denen der Treffer-Titel gebaut wird (erstes nicht-leeres bevorzugt). */
  titleFields: string[]
  subtitleFields?: string[]
  filterFields?: FilterField[]
  globalWeight: number
  inGlobalSearch: boolean
}

export type FilterWert =
  | { op: "ilike"; value: string }
  | { op: "eq"; value: string | number | boolean }
  | { op: "in"; values: (string | number)[] }
  | { op: "gte"; value: string | number }
  | { op: "lte"; value: string | number }
  | { op: "is"; value: boolean }

export type FilterInput = {
  suchtext?: string
  filter?: Record<string, FilterWert>
}

export type SearchResult = {
  entityKey: string
  entityLabel: string
  id: string
  title: string
  subtitle?: string | null
  route: string
  score: number
}
