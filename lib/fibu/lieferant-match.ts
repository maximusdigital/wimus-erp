/**
 * Lieferant-Matching (Spec 0002, 30_prozesse Kap. 5 – Einheiten-Zuordnung).
 * Ordnet einem erkannten Lieferantennamen einen Kreditor zu (Name/Alias, fuzzy)
 * → daraus firma_id (Buchungskreis) + Standard-Konto. Rein/testbar.
 */

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
 * Bestes Match für einen Lieferantennamen. Exakter Alias/Name-Treffer vor
 * Teilstring-Treffer. Kein Treffer → null (Beleg bleibt firma-unzugeordnet).
 */
export function matchLieferant(
  name: string | null | undefined,
  kandidaten: LieferantKandidat[]
): LieferantTreffer | null {
  if (!name || !name.trim()) return null
  const n = norm(name)
  if (!n) return null

  let teiltreffer: LieferantKandidat | null = null
  for (const k of kandidaten) {
    const namen = [k.name, ...(k.alias ?? [])].map(norm).filter(Boolean)
    // Exakter (normalisierter) Treffer hat Vorrang.
    if (namen.includes(n)) return treffer(k)
    // Teilstring in beide Richtungen (z. B. "DM" ↔ "dm drogerie markt").
    if (!teiltreffer && namen.some((m) => m && (n.includes(m) || m.includes(n)))) {
      teiltreffer = k
    }
  }
  return teiltreffer ? treffer(teiltreffer) : null
}

function treffer(k: LieferantKandidat): LieferantTreffer {
  return {
    lieferant_id: k.id,
    firma_id: k.firma_id,
    standard_konto: k.standard_konto,
    standard_gewerk: k.standard_gewerk,
  }
}
