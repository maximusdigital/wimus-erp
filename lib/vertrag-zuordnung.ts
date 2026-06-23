import { createServerClient } from "@/lib/supabase/server"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { kontaktName } from "@/types/kontakt"
import type { MultiSelectOption } from "@/components/shared/multi-select-list"

/** Vertrags-Beziehung, die aus den Stammdaten-Masken gepflegt werden kann. */
export type VertragRelation = "objekt_id" | "einheit_id" | "mieter_id"

export type VertragZuordnung = {
  id: string
  label: string
  objekt_id: string | null
  einheit_id: string | null
  mieter_id: string | null
}

/** Alle Verträge als Zuordnungs-Kandidaten laden (mit lesbarem Label). */
export async function loadVertragZuordnungen(): Promise<VertragZuordnung[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("vertraege")
    .select(
      "id, vertragsnummer, objekt_id, einheit_id, mieter_id, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code), mieter:kontakte(vorname, nachname, firma)"
    )
    .order("beginn", { nullsFirst: false })

  type Row = {
    id: string
    vertragsnummer: string | null
    objekt_id: string | null
    einheit_id: string | null
    mieter_id: string | null
    objekt: { kuerzel: string | null } | null
    einheit: { verwendungszweck_code: string | null } | null
    mieter: { vorname: string | null; nachname: string | null; firma: string | null } | null
  }

  let rows = (data ?? []) as unknown as Row[]

  if (isPreviewNoAuth() && rows.length === 0) {
    rows = DEMO_VERTRAEGE.map((v) => ({
      id: v.id,
      vertragsnummer: v.vertragsnummer,
      objekt_id: v.objekt_id,
      einheit_id: v.einheit_id,
      mieter_id: v.mieter_id,
      objekt: v.objekt ? { kuerzel: v.objekt.kuerzel } : null,
      einheit: v.einheit
        ? { verwendungszweck_code: v.einheit.verwendungszweck_code }
        : null,
      mieter: v.mieter,
    }))
  }

  return rows.map((r) => {
    const kontext = [
      r.objekt?.kuerzel,
      r.einheit?.verwendungszweck_code,
      r.mieter ? kontaktName(r.mieter) : null,
    ]
      .filter(Boolean)
      .join(" · ")
    const label = r.vertragsnummer
      ? `${r.vertragsnummer}${kontext ? ` (${kontext})` : ""}`
      : kontext || "Vertrag ohne Nummer"
    return {
      id: r.id,
      label,
      objekt_id: r.objekt_id,
      einheit_id: r.einheit_id,
      mieter_id: r.mieter_id,
    }
  })
}

/**
 * Optionen + Vorauswahl für eine konkrete Vertrags-Beziehung bauen.
 * Vertrags-FKs sind nullable → volle Add/Remove-Semantik (kein Lock).
 */
export function buildVertragOptionen(
  vertraege: VertragZuordnung[],
  relation: VertragRelation,
  entityId?: string
): { options: MultiSelectOption[]; selectedIds: string[] } {
  const selectedIds = entityId
    ? vertraege.filter((v) => v[relation] === entityId).map((v) => v.id)
    : []

  const options: MultiSelectOption[] = vertraege.map((v) => {
    const fremd = v[relation] && v[relation] !== entityId
    return {
      value: v.id,
      label: v.label,
      hint: fremd ? "bereits zugeordnet" : undefined,
    }
  })

  return { options, selectedIds }
}
