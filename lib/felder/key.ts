/**
 * Stabiler `key` aus Label (Pipedrive-Prinzip): einmal erzeugt, dann fix.
 * Code/Filter referenzieren IMMER den key, nie das Label. Label bleibt umbenennbar.
 */

const UMLAUTE: Record<string, string> = {
  ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue",
}

/**
 * Erzeugt einen slug-stabilen key aus einem Label.
 * - Umlaute transliteriert, Kleinbuchstaben, nur [a-z0-9_].
 * - beginnt garantiert mit einem Buchstaben (sonst `f_`-Präfix), nie leer.
 */
export function slugifyKey(label: string): string {
  const base = (label ?? "")
    .trim()
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUTE[c] ?? c)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // diakritische Zeichen
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")

  if (!base) return "feld"
  return /^[a-z]/.test(base) ? base : `f_${base}`
}

/**
 * Macht einen key innerhalb einer Menge bereits vergebener keys eindeutig
 * (hängt _2, _3 … an). Deterministisch — kein Zufall.
 */
export function uniqueKey(label: string, vergeben: Iterable<string>): string {
  const set = new Set(vergeben)
  const base = slugifyKey(label)
  if (!set.has(base)) return base
  let i = 2
  while (set.has(`${base}_${i}`)) i++
  return `${base}_${i}`
}
