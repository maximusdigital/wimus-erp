/**
 * Andockung an Modul 0006 (Suche/Filter) — KEIN zweites Filtersystem.
 *
 * Zwei Aufgaben:
 *  1. `defsToFilterFields`: aktive custom_field_def → dynamische `FilterField[]`,
 *     die die 0006-`filter-bar` automatisch rendert (Spalten-key mit `cf_`-Präfix,
 *     damit keine Kollision mit echten Entitäts-Spalten).
 *  2. `customFieldIds`: löst einen Custom-Field-Filter zu der Menge der
 *     entitaet_ids auf (id-Prefilter). Der 0006-Query-Builder kennt nur flache
 *     Spalten; statt ihn umzubauen, übersetzen wir Custom-Field-Filter in ein
 *     `.in("id", ids)` auf der Entitäts-Query (Variante C: Self-Join vermieden).
 */
import type { FilterField } from "@/lib/search/types"
import { filterTypFor } from "./mapping"
import type { FieldDef, FieldType } from "./types"

export const CF_PREFIX = "cf_"

/** key der dynamischen Filterspalte für ein Custom Field. */
export function cfColumn(defKey: string): string {
  return `${CF_PREFIX}${defKey}`
}

/** Ist diese Filterspalte ein Custom Field? */
export function isCfColumn(column: string): boolean {
  return column.startsWith(CF_PREFIX)
}

/** entfernt das `cf_`-Präfix → stabiler def-key. */
export function cfKeyFromColumn(column: string): string {
  return column.slice(CF_PREFIX.length)
}

/** Aktive Felddefinitionen → dynamische 0006-FilterFields. */
export function defsToFilterFields(defs: FieldDef[]): FilterField[] {
  return defs
    .filter((d) => d.aktiv)
    .map((d) => {
      const type = filterTypFor(d.typ)
      const field: FilterField = {
        column: cfColumn(d.key),
        label: d.label,
        type,
      }
      if (type === "enum" && d.optionen) {
        field.optionen = d.optionen
          .filter((o) => o.aktiv)
          .map((o) => ({ value: o.opt_key, label: o.label }))
      }
      return field
    })
}

// --- id-Prefilter-Resolver (Variante C) -------------------------------------
// Minimaler Supabase-Client-Shape (entkoppelt von @supabase/supabase-js-Typen).
type Filterable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: (s: string) => any
}

export type CfFilterWert =
  | { op: "eq"; value: string | number | boolean }
  | { op: "in"; values: string[] } // opt_keys (auswahl/mehrfachauswahl)
  | { op: "gte"; value: string | number }
  | { op: "lte"; value: string | number }
  | { op: "ilike"; value: string }
  | { op: "is"; value: boolean }

/**
 * Liefert die entitaet_ids (custom_field_werte.bezug_id), die den Filter auf
 * EINEM Custom Field erfüllen. Mehrere Custom-Field-Filter UND-verknüpft der
 * Aufrufer per Schnittmenge der id-Listen, danach `.in("id", ids)`.
 *
 * RLS greift in der DB (mandant_isolation auf custom_field_werte). `def` muss
 * zur Ziel-Entität gehören (Aufrufer stellt das über die filterFields sicher).
 */
export async function customFieldIds(
  client: Filterable,
  def: Pick<FieldDef, "id" | "typ">,
  entitaet: string,
  filter: CfFilterWert,
): Promise<string[]> {
  // mehrfachauswahl: Treffer über custom_field_value_option → value_id → bezug_id.
  if (def.typ === "mehrfachauswahl") {
    const optKeys = filter.op === "in" ? filter.values : filter.op === "eq" ? [String(filter.value)] : []
    if (optKeys.length === 0) return []
    const { data: opts } = await client
      .schema("wimus")
      .from("custom_field_option")
      .select("id")
      .eq("def_id", def.id)
      .in("opt_key", optKeys)
    const optIds = (opts ?? []).map((o: { id: string }) => o.id)
    if (optIds.length === 0) return []
    const { data: vals } = await client
      .schema("wimus")
      .from("custom_field_value_option")
      .select("custom_field_werte!inner(bezug_id)")
      .in("option_id", optIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return uniq((vals ?? []).map((v: any) => v.custom_field_werte?.bezug_id).filter(Boolean))
  }

  // skalare Typen: Filter auf der passenden wert_*-Spalte.
  const col = scalarColumn(def.typ)
  let q = client
    .schema("wimus")
    .from("custom_field_werte")
    .select("bezug_id")
    .eq("definition_id", def.id)
    .eq("bezug_typ", entitaet)

  switch (filter.op) {
    case "eq":
      q = q.eq(col, filter.value)
      break
    case "in":
      q = q.in(col, filter.values)
      break
    case "gte":
      q = q.gte(col, filter.value)
      break
    case "lte":
      q = q.lte(col, filter.value)
      break
    case "ilike":
      q = q.ilike(col, `%${filter.value}%`)
      break
    case "is":
      q = q.is(col, filter.value)
      break
  }
  const { data } = await q
  return uniq((data ?? []).map((r: { bezug_id: string }) => r.bezug_id).filter(Boolean))
}

function scalarColumn(typ: FieldType): string {
  switch (typ) {
    case "zahl":
      return "wert_zahl"
    case "datum":
      return "wert_datum"
    case "janein":
      return "wert_bool"
    default:
      return "wert_text" // text + auswahl(opt_key)
  }
}

function uniq(xs: string[]): string[] {
  return Array.from(new Set(xs))
}
