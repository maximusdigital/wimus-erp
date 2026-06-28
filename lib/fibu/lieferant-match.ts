/**
 * Lieferant-Matching (Spec 0002, 30_prozesse Kap. 5 – Einheiten-Zuordnung).
 * Ordnet einem erkannten Lieferantennamen einen Kreditor zu (Name/Alias, fuzzy)
 * → daraus firma_id (Buchungskreis) + Standard-Konto. Rein/testbar.
 *
 * String-Distanz kommt aus der zentralen Fuzzy-Engine (`fuzzy.ts` → fuzzball);
 * hier bleibt nur die Domänen-Logik: Firmen-Normalisierung (Rechtsform-Stripping),
 * Alias-Auflösung, exakter Treffer vor Fuzzy, Schwelle.
 */
import { ratio } from "./fuzzy"

/** Mindest-Ähnlichkeit für einen Fuzzy-Treffer (0..1). */
const SCHWELLE = 0.8

export type LieferantKandidat = {
  id: string
  name: string
  alias: string[] | null
  firma_id: string | null
  standard_konto: string | null
  standard_gewerk: string | null
}

export type LieferantTreffer = {
  lieferant_id: string
  firma_id: string | null
  standard_konto: string | null
  standard_gewerk: string | null
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(gmbh|ag|kg|ohg|e\.?k\.?|e\.?v\.?|mbh|co|und|&)\b/g, " ")
    .replace(/[^a-z0-9äöüß ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Bestes Match für einen Lieferantennamen. Exakter (normalisierter) Alias/Name-
 * Treffer hat Vorrang; sonst bester Fuzzy-Treffer (zentrale Engine) ab Schwelle.
 * Kein Treffer → null (Beleg bleibt firma-unzugeordnet).
 */
export function matchLieferant(
  name: string | null | undefined,
  kandidaten: LieferantKandidat[]
): LieferantTreffer | null {
  if (!name || !name.trim()) return null
  const n = norm(name)
  if (!n) return null

  let best: LieferantKandidat | null = null
  let bestScore = 0
  for (const k of kandidaten) {
    const namen = [k.name, ...(k.alias ?? [])].map(norm).filter(Boolean)
    // Exakter (normalisierter) Treffer hat Vorrang.
    if (namen.includes(n)) return treffer(k)
    // Fuzzy-Distanz aus der zentralen Engine (token_set_ratio: subset-/reihenfolgetolerant,
    // deckt frühere Teilstring-Heuristik „DM" ↔ „dm drogerie markt" mit ab).
    for (const m of namen) {
      const s = ratio(n, m)
      if (s > bestScore) {
        bestScore = s
        best = k
      }
    }
  }
  return best && bestScore >= SCHWELLE ? treffer(best) : null
}

function treffer(k: LieferantKandidat): LieferantTreffer {
  return {
    lieferant_id: k.id,
    firma_id: k.firma_id,
    standard_konto: k.standard_konto,
    standard_gewerk: k.standard_gewerk,
  }
}
