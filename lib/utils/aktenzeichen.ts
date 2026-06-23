/**
 * Aktenzeichen-Generator für Vorgänge (selbst gebaut).
 *
 * Format: {JAHR}{MANDANT}{OBJEKT}{EINHEIT?}{TYP}{LFDNR:2}
 * Beispiele:
 *   2025 IS 17 A1 WH 01  -> "2025IS17A1WH01"
 *   2025 IS 17    WH 01  -> "2025IS17WH01"   (ohne Einheit, Objekt-Ebene)
 *
 * In der DB setzt ein Trigger das Aktenzeichen; diese reinen Funktionen
 * spiegeln dieselbe Logik für Vorschau, Tests und clientseitige Anzeige.
 */

export type AktenzeichenTeile = {
  jahr: number
  mandant: string
  objekt: string
  /** Optionales Einheit-Kürzel (z. B. "A1"); weglassen für Objekt-Ebene. */
  einheit?: string | null
  /** Typ-Segment, Default "WH". */
  typ?: string
}

/** Zweistellige, nullgepolsterte laufende Nummer. */
function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/** Präfix ohne laufende Nummer (alles bis einschließlich Typ-Segment). */
export function aktenzeichenPraefix({
  jahr,
  mandant,
  objekt,
  einheit,
  typ = "WH",
}: AktenzeichenTeile): string {
  const e = einheit && einheit.trim() !== "" ? einheit.trim() : ""
  return `${jahr}${mandant}${objekt}${e}${typ}`
}

/** Vollständiges Aktenzeichen aus Teilen + laufender Nummer. */
export function generateAktenzeichen(
  teile: AktenzeichenTeile,
  lfdNr: number
): string {
  return `${aktenzeichenPraefix(teile)}${pad2(lfdNr)}`
}

/**
 * Nächste laufende Nummer für ein Präfix: max(bestehende LfdNr) + 1.
 * Berücksichtigt nur Aktenzeichen, die exakt mit dem Präfix beginnen
 * (gleiches Jahr, Mandant, Objekt, Einheit, Typ) → Jahreswechsel startet
 * automatisch wieder bei 01.
 */
export function naechsteLfdNr(praefix: string, vorhandene: string[]): number {
  let max = 0
  for (const az of vorhandene) {
    if (!az.startsWith(praefix)) continue
    const rest = az.slice(praefix.length)
    if (!/^\d+$/.test(rest)) continue
    const n = parseInt(rest, 10)
    if (n > max) max = n
  }
  return max + 1
}
