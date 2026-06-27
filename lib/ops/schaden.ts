/**
 * Schadens-Staffel (Spec 0004 / Spec502 §3.1). Rein/testbar.
 * <50 Bagatell (Kaution) · 50–500 mittel (Plattform) · 500–5.000 gross (manuell+Versicherung)
 * · 5.000–10.000 grossschaden (Mahnbescheid) · >10.000 grossschaden (Anwalt).
 */

export type Schwere = "bagatell" | "mittel" | "gross" | "grossschaden"
export type Abwicklungsstufe = "kaution" | "plattform" | "manuell" | "mahnbescheid" | "anwalt"

export function schwereAusBetrag(betrag: number | null | undefined): Schwere {
  const b = betrag ?? 0
  if (b < 50) return "bagatell"
  if (b < 500) return "mittel"
  if (b < 5000) return "gross"
  return "grossschaden"
}

export function abwicklungsstufeAusBetrag(betrag: number | null | undefined): Abwicklungsstufe {
  const b = betrag ?? 0
  if (b < 50) return "kaution"
  if (b < 500) return "plattform"
  if (b < 5000) return "manuell"
  if (b < 10000) return "mahnbescheid"
  return "anwalt"
}

/** Empfehlung aus dem Betrag: Schwere + Abwicklungsstufe + Versicherungs-Hinweis. */
export function schadenEinstufung(betrag: number | null | undefined): {
  schwere: Schwere
  abwicklungsstufe: Abwicklungsstufe
  versicherung_pruefen: boolean
} {
  const b = betrag ?? 0
  return {
    schwere: schwereAusBetrag(b),
    abwicklungsstufe: abwicklungsstufeAusBetrag(b),
    versicherung_pruefen: b >= 500,
  }
}
