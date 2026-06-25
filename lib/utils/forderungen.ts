/**
 * Forderungsmanagement – Kernlogik (Spec 0001 / 30_prozesse Kap. 3).
 *
 * Eine Forderungs-Tabelle für alle Forderungen (Miete, BK-Nachzahlung,
 * Sachschaden, Nutzungsausfall, CityTax …). Kaution ist der Verrechnungstopf,
 * Mahnwesen läuft automatisch. Diese Funktionen sind rein + testbar.
 */

/** Rundet auf 2 Nachkommastellen (Euro-Cent). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Schadensmanagement – Eskalationsstufe nach Schadensbetrag (Spec 30_prozesse 3).
 *   < 50 €        : Kaution direkt (auto)
 *   50–500 €      : Kaution + Mahnung Stufe 1 (Alert)
 *   500–5.000 €   : Kaution + Versicherung (Versicherungsmeldung)
 *   5.000–10.000 €: Versicherung + Mahnbescheid (KI-Klageschrift)
 *   > 10.000 €    : Anwalt (Alert)
 */
export type SchadenEskalation = {
  stufe: 1 | 2 | 3 | 4 | 5
  label: string
  kaution: boolean
  mahnung: boolean
  versicherung: boolean
  mahnbescheid: boolean
  anwalt: boolean
}

export function schadenEskalation(betrag: number): SchadenEskalation {
  const b = betrag
  if (b < 50)
    return { stufe: 1, label: "Kaution direkt", kaution: true, mahnung: false, versicherung: false, mahnbescheid: false, anwalt: false }
  if (b < 500)
    return { stufe: 2, label: "Kaution + Mahnung", kaution: true, mahnung: true, versicherung: false, mahnbescheid: false, anwalt: false }
  if (b < 5000)
    return { stufe: 3, label: "Kaution + Versicherung", kaution: true, mahnung: false, versicherung: true, mahnbescheid: false, anwalt: false }
  if (b < 10000)
    return { stufe: 4, label: "Versicherung + Mahnbescheid", kaution: false, mahnung: false, versicherung: true, mahnbescheid: true, anwalt: false }
  return { stufe: 5, label: "Anwalt", kaution: false, mahnung: false, versicherung: false, mahnbescheid: false, anwalt: true }
}

/** Noch offener Betrag einer Forderung (betrag − bereits bezahlt). */
export function offenerBetrag(f: {
  betrag: number | null
  bezahlt_betrag?: number | null
}): number {
  return round2((f.betrag ?? 0) - (f.bezahlt_betrag ?? 0))
}

/**
 * Kaution als Verrechnungstopf (Spec 30_prozesse 3): erst alle offenen
 * Forderungen gegen die Kaution verrechnen.
 *   Rest positiv → Rückzahlung an Mieter (SEPA)
 *   Rest negativ → Nachforderung → Mahnwesen
 */
export type KautionVerrechnung = {
  forderungenSumme: number
  verrechnet: number
  /** > 0: an Mieter zurückzuzahlen. */
  rueckzahlung: number
  /** > 0: vom Mieter nachzufordern. */
  nachforderung: number
}

export function kautionVerrechnung(
  offeneForderungen: number,
  kautionBetrag: number
): KautionVerrechnung {
  const summe = round2(offeneForderungen)
  const kaution = round2(kautionBetrag)
  const verrechnet = round2(Math.min(summe, kaution))
  const rest = round2(kaution - summe)
  return {
    forderungenSumme: summe,
    verrechnet,
    rueckzahlung: rest > 0 ? rest : 0,
    nachforderung: rest < 0 ? round2(-rest) : 0,
  }
}
