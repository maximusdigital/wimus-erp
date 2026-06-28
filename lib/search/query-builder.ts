/**
 * Generischer Filter-/Such-Query-Builder (Modul 006). REINER Übersetzer:
 * FilterInput + Registry-Entität → Liste von `QueryOp` (Operator-Deskriptoren).
 * Das Anwenden auf die Supabase-Query (RLS-konform) macht der Aufrufer
 * (`global-search.ts` / die Filterleisten-Route) — so bleibt die Logik testbar.
 */
import type { FilterInput, SearchEntity } from "./types"

export type QueryOp =
  | { kind: "orIlike"; expr: string } // Supabase .or("col.ilike.%v%,…")
  | { kind: "ilike"; column: string; value: string }
  | { kind: "eq"; column: string; value: string | number | boolean }
  | { kind: "in"; column: string; values: (string | number)[] }
  | { kind: "gte"; column: string; value: string | number }
  | { kind: "lte"; column: string; value: string | number }
  | { kind: "is"; column: string; value: boolean }

/** Entschärft Eingaben für den `.or()`-Ausdruck (Kommas/Klammern/Prozent raus). */
export function escapeOr(v: string): string {
  return v.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Übersetzt FilterInput (Freitext + Filter-Chips) in QueryOps.
 * - Freitext → Trigram/ILIKE über die `trigramFields` der Entität (ODER-verknüpft).
 * - Filter-Chips → ein Op je Feld (UND-verknüpft, da Supabase-Filter additiv sind).
 */
export function buildQueryOps(entity: SearchEntity, input: FilterInput): QueryOp[] {
  const ops: QueryOp[] = []

  const text = input.suchtext?.trim()
  if (text && entity.trigramFields.length > 0) {
    const safe = escapeOr(text)
    if (safe.length > 0) {
      ops.push({
        kind: "orIlike",
        expr: entity.trigramFields.map((f) => `${f}.ilike.%${safe}%`).join(","),
      })
    }
  }

  for (const [column, w] of Object.entries(input.filter ?? {})) {
    switch (w.op) {
      case "ilike":
        ops.push({ kind: "ilike", column, value: w.value })
        break
      case "eq":
        ops.push({ kind: "eq", column, value: w.value })
        break
      case "in":
        if (w.values.length > 0) ops.push({ kind: "in", column, values: w.values })
        break
      case "gte":
        ops.push({ kind: "gte", column, value: w.value })
        break
      case "lte":
        ops.push({ kind: "lte", column, value: w.value })
        break
      case "is":
        ops.push({ kind: "is", column, value: w.value })
        break
    }
  }

  return ops
}

/** Wendet QueryOps auf eine Supabase-Filter-Query an (RLS greift in der DB). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyOps<Q extends Record<string, any>>(query: Q, ops: QueryOp[]): Q {
  let q = query
  for (const op of ops) {
    switch (op.kind) {
      case "orIlike":
        q = q.or(op.expr)
        break
      case "ilike":
        q = q.ilike(op.column, `%${op.value}%`)
        break
      case "eq":
        q = q.eq(op.column, op.value)
        break
      case "in":
        q = q.in(op.column, op.values)
        break
      case "gte":
        q = q.gte(op.column, op.value)
        break
      case "lte":
        q = q.lte(op.column, op.value)
        break
      case "is":
        q = q.is(op.column, op.value)
        break
    }
  }
  return q
}
