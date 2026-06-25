/**
 * Betriebskosten – Kern-Rechenlogik (Spec 0001 / 30_prozesse Kap. 1).
 *
 * Alle BK laufen durch dieselbe Logik. Zwei Bausteine:
 *  1) Verbrauchs-Umrechnung in kWh (Gas/Heizöl/Pellets …) via Brennwert.
 *  2) Verteilung eines Gesamtbetrags auf Abrechnungseinheit-Mitglieder nach
 *     Umlageschlüssel. Reine Funktionen, testbar.
 */

/** Rundet auf 2 Nachkommastellen (Euro-Cent). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Standard-Heizwerte (kWh je Einheit) – Default, falls nicht versorgerspezifisch. */
export const HEIZWERT = {
  /** Heizöl: ~9,8 kWh/Liter. */
  heizoel_kwh_pro_liter: 9.8,
  /** Pellets: ~4,8 kWh/kg. */
  pellets_kwh_pro_kg: 4.8,
} as const

/**
 * Verbrauch in kWh umrechnen.
 *   gas:        m³ × brennwert × zustandszahl
 *   heizoel:    Liter × 9,8
 *   pellets:    kg × 4,8
 *   strom/fernwaerme/kwh: bereits kWh (direkt)
 */
export function verbrauchKwh(
  eingang: "gas" | "heizoel" | "pellets" | "kwh",
  menge: number,
  opts?: { brennwert?: number; zustandszahl?: number }
): number {
  switch (eingang) {
    case "gas": {
      const brennwert = opts?.brennwert ?? 10.0
      const zustandszahl = opts?.zustandszahl ?? 0.95
      return round2(menge * brennwert * zustandszahl)
    }
    case "heizoel":
      return round2(menge * HEIZWERT.heizoel_kwh_pro_liter)
    case "pellets":
      return round2(menge * HEIZWERT.pellets_kwh_pro_kg)
    case "kwh":
    default:
      return round2(menge)
  }
}

/** Warmwasseranteil aus den Heizkosten (HKVO §9, Default 18%). */
export function warmwasserKosten(heizkosten: number, prozent = 18): number {
  return round2(heizkosten * (prozent / 100))
}

/**
 * HKVO-Verteilung eines Heizkostenbetrags: Anteil x% nach Verbrauch (Default 70),
 * Rest nach Fläche. Gibt die beiden Töpfe zurück.
 */
export function hkvoToepfe(
  gesamt: number,
  verbrauchProzent = 70
): { verbrauchTopf: number; flaecheTopf: number } {
  const v = round2(gesamt * (verbrauchProzent / 100))
  return { verbrauchTopf: v, flaecheTopf: round2(gesamt - v) }
}

export type Umlageschluessel =
  | "kopfzahl"
  | "flaeche"
  | "einheit"
  | "verbrauch"
  | "miteigentum"
  | "individuell"

export type BkMitglied = {
  id: string
  /** Bezugswert je nach Schlüssel (Köpfe / m² / Verbrauch / MEA). */
  wert?: number | null
  /** Fester Anteil in % (Schlüssel "individuell"). */
  fester_anteil_pct?: number | null
  /** KZV/intern abgerechnet → trägt 0 (Vermieter). */
  intern_abgerechnet?: boolean | null
}

/**
 * Verteilt `betrag` auf die Mitglieder nach Schlüssel. Intern abgerechnete
 * Mitglieder tragen 0. Rundungsrest landet beim letzten zahlenden Mitglied,
 * damit die Summe exakt aufgeht.
 */
export function verteileKosten(
  betrag: number,
  mitglieder: BkMitglied[],
  schluessel: Umlageschluessel
): { id: string; anteil_pct: number; betrag: number }[] {
  const zahlend = mitglieder.filter((m) => !m.intern_abgerechnet)

  // Gewicht je Mitglied bestimmen.
  const gewicht = (m: BkMitglied): number => {
    switch (schluessel) {
      case "einheit":
        return 1
      case "individuell":
        return (m.fester_anteil_pct ?? 0) / 100
      default: // kopfzahl/flaeche/verbrauch/miteigentum
        return m.wert ?? 0
    }
  }

  const summe = zahlend.reduce((s, m) => s + gewicht(m), 0)

  const result = mitglieder.map((m) => ({ id: m.id, anteil_pct: 0, betrag: 0 }))
  if (summe <= 0) return result

  let verteilt = 0
  const zahlendIds = zahlend.map((m) => m.id)
  for (let i = 0; i < mitglieder.length; i++) {
    const m = mitglieder[i]
    if (m.intern_abgerechnet) continue
    const anteil = gewicht(m) / summe
    const istLetztesZahlend = m.id === zahlendIds[zahlendIds.length - 1]
    const b = istLetztesZahlend
      ? round2(betrag - verteilt)
      : round2(betrag * anteil)
    verteilt = round2(verteilt + b)
    result[i] = { id: m.id, anteil_pct: round2(anteil * 100), betrag: b }
  }
  return result
}
