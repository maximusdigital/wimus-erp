/**
 * Verwendungszweck-Parser für den KZV-/Mietzahlungs-Verwendungszweck.
 *
 * Format: {OBJEKTKÜRZEL}W{WOHNUNG}Z{ZIMMER}
 *   BHS16W3Z1 = Bauhofstraße 16, Wohnung 3, Zimmer 1
 *   AS125W2Z2 = Austraße 125, Wohnung 2, Zimmer 2
 *   BS21A     = Bietigheimer Str. 21A (EFH, keine Unterteilung)
 *
 * Siehe CLAUDE.md → „Verwendungszweck-Schema".
 */

export type Verwendungszweck = {
  objektKuerzel: string
  wohnung: number | null
  zimmer: number | null
}

/** Parst einen Verwendungszweck-Code. Gibt null zurück, wenn das Format nicht passt. */
export function parseVerwendungszweck(vz: string): Verwendungszweck | null {
  if (!vz) return null
  const match = vz.trim().toUpperCase().match(/^([A-Z0-9]+?)(?:W(\d+))?(?:Z(\d+))?$/)
  if (!match) return null
  return {
    objektKuerzel: match[1],
    wohnung: match[2] ? parseInt(match[2], 10) : null,
    zimmer: match[3] ? parseInt(match[3], 10) : null,
  }
}

/** Baut einen Verwendungszweck-Code aus seinen Bestandteilen. */
export function buildVerwendungszweck(
  objektKuerzel: string,
  wohnung?: number | null,
  zimmer?: number | null
): string {
  let code = objektKuerzel.trim().toUpperCase()
  if (wohnung != null) code += `W${wohnung}`
  if (zimmer != null) code += `Z${zimmer}`
  return code
}

/** Menschlich lesbare Beschreibung eines Verwendungszweck-Codes. */
export function formatVerwendungszweck(vz: string): string {
  const parsed = parseVerwendungszweck(vz)
  if (!parsed) return vz
  const teile = [parsed.objektKuerzel]
  if (parsed.wohnung != null) teile.push(`Wohnung ${parsed.wohnung}`)
  if (parsed.zimmer != null) teile.push(`Zimmer ${parsed.zimmer}`)
  return teile.join(" · ")
}
