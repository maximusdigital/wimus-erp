/**
 * Mahnwesen – 5-stufige Mahnlogik (selbst gebaut).
 *
 * Stufen (vgl. types/mahnung.ts):
 *   1 Zahlungserinnerung · 2 1. Mahnung · 3 2. Mahnung ·
 *   4 Letzte Mahnung · 5 Inkasso/Mahnbescheid
 *
 * Annahmen (dokumentiert, da v5 keine festen Beträge vorgibt):
 *  - Mahngebühren je Stufe: Stufe 1 = 0 € (reine Erinnerung), danach
 *    pauschal ansteigend. Anpassbar über MAHNGEBUEHREN.
 *  - Verzugszinsen p. a. taggenau (actual/365): Hauptforderung ×
 *    Zinssatz%/100 × Tage/365.
 *  - AG-Schwelle ab 01.01.2026: bis < 10.000 € kein Anwaltszwang
 *    (Amtsgericht, KI kann vorbereiten).
 */

/** Rundet auf 2 Nachkommastellen (Euro-Cent). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Mahngebühr je Stufe (€). Stufe 1 ist gebührenfrei. */
export const MAHNGEBUEHREN: Record<number, number> = {
  1: 0,
  2: 5,
  3: 10,
  4: 15,
  5: 0, // Inkasso/Mahnbescheid: Kosten laufen über das gerichtliche Verfahren
}

/** AG-Streitwertgrenze (kein Anwaltszwang darunter) ab 01.01.2026. */
export const AG_SCHWELLE_EUR = 10_000

/** Mahngebühr für eine Stufe (0, wenn Stufe unbekannt). */
export function mahngebuehr(stufe: number): number {
  return MAHNGEBUEHREN[stufe] ?? 0
}

/**
 * Verzugszinsen taggenau:
 *   Hauptforderung × Zinssatz%/100 × Tage/365
 */
export function mahnzinsen(
  hauptforderung: number,
  zinssatzProzentProJahr: number,
  tage: number
): number {
  if (hauptforderung <= 0 || zinssatzProzentProJahr <= 0 || tage <= 0) return 0
  return round2((hauptforderung * (zinssatzProzentProJahr / 100) * tage) / 365)
}

/** Gesamtforderung = Hauptforderung + Zinsen + Gebühren. */
export function mahnGesamt(
  hauptforderung: number,
  zinsen: number,
  gebuehren: number
): number {
  return round2((hauptforderung || 0) + (zinsen || 0) + (gebuehren || 0))
}

/** true, wenn die Gesamtforderung unter der AG-Schwelle liegt. */
export function istUnterAgSchwelle(gesamtforderung: number): boolean {
  return gesamtforderung < AG_SCHWELLE_EUR
}

/**
 * Anwaltszwang? Bei Forderungen unter der AG-Schwelle (Amtsgericht)
 * besteht kein Anwaltszwang – Räumungsklagen ausgenommen (immer AG,
 * aber separater Fall).
 */
export function anwaltszwang(gesamtforderung: number): boolean {
  return !istUnterAgSchwelle(gesamtforderung)
}

/**
 * Idempotenz-Guard: Eine Mahnstufe wird nur gesendet, wenn sie noch nicht
 * versendet wurde (kein `versendet_am` gesetzt).
 */
export function sollMahnungSenden(
  versendetAm: string | null | undefined
): boolean {
  return versendetAm == null || versendetAm.trim() === ""
}

/** Nächste Stufe (max. 5). */
export function naechsteStufe(stufe: number): number {
  return Math.min(stufe + 1, 5)
}
