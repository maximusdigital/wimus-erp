import { createServerClient } from "@/lib/supabase/server"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { kontaktName } from "@/types/kontakt"
import type { MultiSelectOption } from "@/components/shared/multi-select-list"

/**
 * Vertrags-Beziehung, die aus den Stammdaten-Masken gepflegt werden kann.
 * mietvertraege hat keine objekt_id mehr – Objekt-Bezug läuft über die Einheit.
 */
export type VertragRelation = "einheit_id" | "mieter_id"

export type VertragZuordnung = {
  id: string
  label: string
  einheit_id: string | null
  mieter_id: string | null
}

/** Alle Verträge als Zuordnungs-Kandidaten laden (mit lesbarem Label). */
export async function loadVertragZuordnungen(): Promise<VertragZuordnung[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("mietvertraege")
    .select(
      "id, vertragstyp, einheit_id, mieter_id, einheit:einheiten(verwendungszweck_code, objekt:objekte(kuerzel)), mieter:kontakte(vorname, nachname, firmenname)"
    )
    .order("mietbeginn", { nullsFirst: false })

  type Row = {
    id: string
    vertragstyp: string | null
    einheit_id: string | null
    mieter_id: string | null
    einheit:
      | {
          verwendungszweck_code: string | null
          objekt: { kuerzel: string | null } | null
        }
      | null
    mieter: { vorname: string | null; nachname: string | null; firmenname: string | null } | null
  }

  let rows = (data ?? []) as unknown as Row[]

  if (isPreviewNoAuth() && rows.length === 0) {
    rows = DEMO_VERTRAEGE.map((v) => ({
      id: v.id,
      vertragstyp: v.vertragstyp,
      einheit_id: v.einheit_id,
      mieter_id: v.mieter_id,
      einheit: v.einheit
        ? {
            verwendungszweck_code: v.einheit.verwendungszweck_code,
            objekt: v.einheit.objekt ? { kuerzel: v.einheit.objekt.kuerzel } : null,
          }
        : null,
      mieter: v.mieter,
    }))
  }

  return rows.map((r) => {
    const kontext = [
      r.einheit?.objekt?.kuerzel,
      r.einheit?.verwendungszweck_code,
      r.mieter ? kontaktName(r.mieter) : null,
    ]
      .filter(Boolean)
      .join(" · ")
    return {
      id: r.id,
      label: kontext || r.vertragstyp || "Vertrag",
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
