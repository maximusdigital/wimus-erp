/**
 * Belegungs-/Verfügbarkeits-Engine (Kern 0001). ERP = Single Source of Truth.
 *
 * Eine Einheit ist quellenübergreifend belegt durch: KZV-Buchungen (`buchungen`),
 * reguläre Mietverträge (`mietvertraege`) und manuelle Sperren (`belegung_sperren`).
 * Diese Funktionen sind REIN/testbar — die Belegungen aus den drei Quellen werden
 * injiziert (Laden + RLS macht die API-Schicht).
 *
 * Overlap-Logik (halboffene Intervalle [von, bis)): zwei Zeiträume überlappen, wenn
 *   von1 < bis2 UND von2 < bis1.
 * Der Check-out-Tag ist damit frei für einen Check-in. `bis = null` = offenes Ende
 * (z. B. unbefristeter MV / unbefristete Sperre) → läuft unbegrenzt.
 */

export type BelegungQuelle = "buchung" | "mietvertrag" | "sperre"

export type Belegung = {
  quelle: BelegungQuelle
  /** Ref-ID des belegenden Datensatzes (Buchung/MV/Sperre). */
  ref_id: string
  von: string // ISO (Datum oder Datetime)
  bis: string | null // ISO; null = offenes Ende
  /** Anzeige-Info (Status/Grund/Kanal/Mieter). */
  typ?: string | null
  label?: string | null
}

export type VerfuegbarkeitErgebnis = {
  frei: boolean
  kollisionen: Belegung[]
}

/** Zeitpunkt → ms; null/leer = +∞ (offenes Ende). */
function ms(v: string | null | undefined, openEnd = Number.POSITIVE_INFINITY): number {
  if (v == null || v === "") return openEnd
  const t = new Date(v).getTime()
  return Number.isNaN(t) ? openEnd : t
}

/** Halboffener Overlap: [v1,b1) ∩ [v2,b2) ≠ ∅ ⇔ v1 < b2 ∧ v2 < b1. */
export function ueberlappt(
  von1: string,
  bis1: string | null,
  von2: string,
  bis2: string | null
): boolean {
  const v1 = ms(von1, Number.NEGATIVE_INFINITY)
  const b1 = ms(bis1)
  const v2 = ms(von2, Number.NEGATIVE_INFINITY)
  const b2 = ms(bis2)
  return v1 < b2 && v2 < b1
}

/**
 * Findet alle Belegungen, die mit [von, bis) kollidieren.
 * @param ausser eigenen Eintrag (beim Bearbeiten) aus der Prüfung ausnehmen.
 */
export function findeKollisionen(
  von: string,
  bis: string | null,
  belegungen: Belegung[],
  ausser?: { quelle: BelegungQuelle; id: string }
): Belegung[] {
  return belegungen.filter((b) => {
    if (ausser && b.quelle === ausser.quelle && b.ref_id === ausser.id) return false
    return ueberlappt(von, bis, b.von, b.bis)
  })
}

/** Verfügbarkeit einer Einheit für [von, bis) gegen alle injizierten Quellen. */
export function istVerfuegbar(
  von: string,
  bis: string | null,
  belegungen: Belegung[],
  ausser?: { quelle: BelegungQuelle; id: string }
): VerfuegbarkeitErgebnis {
  const kollisionen = findeKollisionen(von, bis, belegungen, ausser)
  return { frei: kollisionen.length === 0, kollisionen }
}

export const BELEGUNG_GRUND = [
  "renovierung",
  "eigennutzung",
  "leerstand_gewollt",
  "sonstiges",
] as const

export const BELEGUNG_GRUND_LABELS: Record<string, string> = {
  renovierung: "Renovierung",
  eigennutzung: "Eigennutzung",
  leerstand_gewollt: "Leerstand (gewollt)",
  sonstiges: "Sonstiges",
}

export const BELEGUNG_QUELLE_LABELS: Record<BelegungQuelle, string> = {
  buchung: "KZV-Buchung",
  mietvertrag: "Mietvertrag",
  sperre: "Sperre",
}
