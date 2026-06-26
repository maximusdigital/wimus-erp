/**
 * Deal-Logik (Spec 0003, 60_tests): Forecast-Basis + Custom-Field-Pflichtprüfung.
 * Reine Funktionen, DB-frei.
 */
import type { CustomFieldDefinition } from "@/types/crm"

/**
 * Erwarteter (gewichteter) Wert = Wert × Wahrscheinlichkeit der Stage.
 * Wahrscheinlichkeit ist 0..100 (Prozent).
 */
export function erwarteterWert(
  wert: number | null | undefined,
  wahrscheinlichkeitProzent: number
): number {
  if (!wert) return 0
  return Math.round(wert * (wahrscheinlichkeitProzent / 100) * 100) / 100
}

/** Custom-Field-Definitionen, die für eine Pipeline + Entität gelten. */
export function relevanteFelder(
  defs: CustomFieldDefinition[],
  opts: { entitaet: "deal" | "lead"; pipelineId?: string | null }
): CustomFieldDefinition[] {
  return defs.filter(
    (d) =>
      d.aktiv &&
      d.entitaet === opts.entitaet &&
      (d.pipeline_id == null || d.pipeline_id === opts.pipelineId)
  )
}

function istLeer(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === "string") return v.trim() === ""
  if (Array.isArray(v)) return v.length === 0
  return false
}

/**
 * Prüft Pflicht-Custom-Fields gegen die Werte. Gibt die Namen der fehlenden
 * Pflichtfelder zurück (leer = ok). Berücksichtigt nur Felder, die im jeweiligen
 * Kontext relevant sind (Pipeline/Entität).
 */
export function fehlendePflichtfelder(
  defs: CustomFieldDefinition[],
  values: Record<string, unknown>,
  opts: { entitaet: "deal" | "lead"; pipelineId?: string | null }
): string[] {
  return relevanteFelder(defs, opts)
    .filter((d) => d.pflicht && istLeer(values?.[d.id]))
    .map((d) => d.name)
}

/** Felder, die im "Neu"-Formular erscheinen. */
export function neuFormularFelder(
  defs: CustomFieldDefinition[],
  opts: { entitaet: "deal" | "lead"; pipelineId?: string | null }
): CustomFieldDefinition[] {
  return relevanteFelder(defs, opts).filter((d) => d.anzeige_hinzufuegen)
}

/** Felder, die in der Detailansicht erscheinen. */
export function detailFelder(
  defs: CustomFieldDefinition[],
  opts: { entitaet: "deal" | "lead"; pipelineId?: string | null }
): CustomFieldDefinition[] {
  return relevanteFelder(defs, opts).filter((d) => d.anzeige_detail)
}
