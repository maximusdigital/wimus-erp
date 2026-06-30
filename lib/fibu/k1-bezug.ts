/**
 * K1 → Entitäts-Bezug (DB-gestützt), für die FiBu-Historie (Modul 009).
 * Löst ein K1-Kürzel gegen das reale wimus-Schema auf:
 *   a) volle Einheit-Code-Übereinstimmung (einheiten.verwendungszweck_code) → Einheit (+Objekt)
 *   b) sonst Objektkürzel (objekte.kuerzel) via vorhandenem Parser → Objekt
 * Nutzt den bestehenden Verwendungszweck-Parser (kein Neubau). Best-effort:
 * DB-Fehler werden geschluckt (Historie blockiert nie). Kein Treffer → {} (= nur Mandant).
 */
import { parseVerwendungszweck } from "@/lib/utils/verwendungszweck"
import type { EntityRef, Hierarchie } from "@/lib/historie/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

export type K1Bezug = { primaer?: EntityRef; hierarchie?: Hierarchie }

export async function resolveK1Bezug(
  client: DbClient,
  mandantId: string,
  k1: string | null | undefined,
): Promise<K1Bezug> {
  const token = (k1 ?? "").trim().toUpperCase()
  if (!token) return {}
  try {
    // a) Volle Einheit-Code-Übereinstimmung (z. B. BHS16W3Z1 / ThS97Z1).
    const { data: einheiten } = await client
      .from("einheiten")
      .select("id, objekt_id")
      .eq("mandant_id", mandantId)
      .ilike("verwendungszweck_code", token)
      .limit(1)
    const einheit = einheiten?.[0]
    if (einheit) {
      return { primaer: { typ: "einheit", id: einheit.id }, hierarchie: { objekt_id: einheit.objekt_id } }
    }

    // b) Objektkürzel aus dem Token ziehen und gegen objekte.kuerzel auflösen.
    const p = parseVerwendungszweck(token)
    if (p) {
      const { data: objekte } = await client
        .from("objekte")
        .select("id")
        .eq("mandant_id", mandantId)
        .ilike("kuerzel", p.objektKuerzel)
        .limit(1)
      const objekt = objekte?.[0]
      if (objekt) return { primaer: { typ: "objekt", id: objekt.id } }
    }
  } catch {
    /* best-effort – fehlende Auflösung ist kein Fehler (→ nur Mandant) */
  }
  return {}
}
