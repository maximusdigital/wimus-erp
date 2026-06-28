/**
 * Zentrale Fuzzy-String-Engine (Spec 0002). EINE Distanz-Implementierung im ganzen
 * ERP: gepflegte Lib `fuzzball` (token_set_ratio, wortreihenfolge-/subset-tolerant)
 * statt Eigenbau. Konsumenten: `lieferant-match.ts` (Belege) und `bank-match.ts`
 * (Bank-Abgleich Mieter-Name). Domänen-Normalisierung/Alias-Logik liegt beim Aufrufer.
 */
import * as fuzz from "fuzzball"

/** Ähnlichkeit zweier Strings, 0..1 (fuzzball token_set_ratio / 100). */
export function ratio(a: string, b: string): number {
  if (!a || !b) return 0
  return fuzz.token_set_ratio(a, b) / 100
}

/** Generische Normalisierung: lowercase, Sonderzeichen → Space, Mehrfach-Space weg. */
export function normBase(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9äöüß ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Personen-Namensvarianten für den Mieter-Match: behandelt „Nachname, Vorname"
 * ↔ „Vorname Nachname" (Bank-Absender vs. Kontakt-Stamm).
 */
export function personVarianten(name: string): string[] {
  const base = normBase(name)
  if (!base) return []
  const out = new Set<string>([base])
  const komma = name.split(",")
  if (komma.length === 2) {
    const swap = normBase(`${komma[1]} ${komma[0]}`)
    if (swap) out.add(swap)
  } else {
    const teile = base.split(" ")
    if (teile.length === 2) out.add(`${teile[1]} ${teile[0]}`)
  }
  return [...out]
}

/** Bester Ähnlichkeitswert zweier Personennamen über alle Varianten, 0..1. */
export function personRatio(a: string, b: string): number {
  let best = 0
  for (const x of personVarianten(a)) {
    for (const y of personVarianten(b)) {
      best = Math.max(best, ratio(x, y))
      if (best >= 1) return 1
    }
  }
  return best
}
