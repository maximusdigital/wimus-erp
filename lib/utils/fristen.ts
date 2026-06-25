/**
 * Fristenmanagement – Kernlogik (Spec 0001 / 30_prozesse Kap. 2).
 *
 * Eine Tabelle für alle Deadlines (BK-Anpassung, Mieterhöhung, Wartung,
 * Verjährung …). n8n prüft täglich und löst Aktionen aus. Diese Funktionen
 * sind rein + testbar; `heute` wird als ISO-String übergeben (Determinismus).
 */

/** Tage zwischen heute und Fälligkeit (negativ = überfällig). */
export function tageBisFaellig(
  faellig_am: string | null | undefined,
  heute: string
): number | null {
  if (!faellig_am) return null
  const a = new Date(faellig_am)
  const b = new Date(heute)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  const ms = a.getTime() - b.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export type FristAmpel = "erledigt" | "rot" | "gelb" | "gruen"

/**
 * Ampel einer Frist:
 *   erledigt  → status erledigt
 *   rot       → überfällig oder ≤ 7 Tage
 *   gelb      → ≤ 30 Tage
 *   gruen     → > 30 Tage (oder kein Datum)
 */
export function fristAmpel(
  faellig_am: string | null | undefined,
  heute: string,
  status?: string | null
): FristAmpel {
  if (status === "erledigt") return "erledigt"
  const t = tageBisFaellig(faellig_am, heute)
  if (t === null) return "gruen"
  if (t <= 7) return "rot"
  if (t <= 30) return "gelb"
  return "gruen"
}

/**
 * Ist heute ein Erinnerungstag? `erinnerung_tage_vorher` (z.B. [30,14,7,1])
 * trifft zu, wenn die verbleibenden Tage exakt einem Eintrag entsprechen.
 */
export function erinnerungFaellig(
  faellig_am: string | null | undefined,
  erinnerung_tage_vorher: number[] | null | undefined,
  heute: string
): boolean {
  const t = tageBisFaellig(faellig_am, heute)
  if (t === null || !erinnerung_tage_vorher) return false
  return erinnerung_tage_vorher.includes(t)
}
