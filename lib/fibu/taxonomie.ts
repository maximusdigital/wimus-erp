/**
 * Reporting-Taxonomie (Spec 0002, reporting_taxonomie): rohe SKR03-/EÜR-Konten auf
 * neutrale Berichtspositionen abbilden, damit GuV/BWA einheitlich aggregiert werden
 * (GmbH-SKR ↔ Privat-EÜR vereinheitlicht). Rein/testbar (DB-frei).
 *
 * Eine Position trägt `mapping` JSONB = { art, konten[] }. `konten` sind Präfixe
 * (z.B. "8" trifft 8xxx, "4240" exakt). Zuordnung = längster passender Präfix.
 */

export type PositionArt = "ertrag" | "aufwand" | "neutral"

export type TaxonomiePosition = {
  position_code: string
  bezeichnung: string
  /** mapping-JSONB der Tabelle. */
  mapping: { art: PositionArt; konten: string[] }
}

export type KontoBetrag = { konto: string; betrag: number }

export type PositionZeile = {
  position_code: string
  bezeichnung: string
  art: PositionArt
  betrag: number
  /** beigetragende Konten (Detail/Drill-down). */
  konten: string[]
}

export type TaxonomieErgebnis = {
  positionen: PositionZeile[]
  /** Konten ohne Treffer in der Taxonomie. */
  nichtZugeordnet: KontoBetrag[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Position mit dem längsten passenden Konto-Präfix (null = keine). */
export function mapKonto(
  konto: string,
  positionen: TaxonomiePosition[]
): TaxonomiePosition | null {
  let best: TaxonomiePosition | null = null
  let bestLen = -1
  for (const p of positionen) {
    for (const k of p.mapping.konten) {
      if (konto.startsWith(k) && k.length > bestLen) {
        best = p
        bestLen = k.length
      }
    }
  }
  return best
}

/**
 * Aggregiert Konto-Beträge auf Berichtspositionen. Konten ohne Treffer landen in
 * `nichtZugeordnet`. Positionen nach `position_code` sortiert.
 */
export function aggregateNachPosition(
  zeilen: KontoBetrag[],
  positionen: TaxonomiePosition[]
): TaxonomieErgebnis {
  const acc = new Map<string, PositionZeile>()
  const nichtZugeordnet: KontoBetrag[] = []

  for (const z of zeilen) {
    const pos = mapKonto(z.konto, positionen)
    if (!pos) {
      nichtZugeordnet.push({ konto: z.konto, betrag: round2(z.betrag) })
      continue
    }
    const cur =
      acc.get(pos.position_code) ??
      {
        position_code: pos.position_code,
        bezeichnung: pos.bezeichnung,
        art: pos.mapping.art,
        betrag: 0,
        konten: [],
      }
    cur.betrag += z.betrag
    if (!cur.konten.includes(z.konto)) cur.konten.push(z.konto)
    acc.set(pos.position_code, cur)
  }

  const positionenOut = [...acc.values()]
    .map((p) => ({ ...p, betrag: round2(p.betrag), konten: p.konten.sort() }))
    .sort((a, b) => a.position_code.localeCompare(b.position_code))

  return {
    positionen: positionenOut,
    nichtZugeordnet: nichtZugeordnet.sort((a, b) => a.konto.localeCompare(b.konto)),
  }
}

/** Summe je Art (für Ertrag-/Aufwand-Blöcke + Ergebnis). */
export function summeJeArt(positionen: PositionZeile[]): {
  ertrag: number
  aufwand: number
  ergebnis: number
} {
  let ertrag = 0
  let aufwand = 0
  for (const p of positionen) {
    if (p.art === "ertrag") ertrag += p.betrag
    else if (p.art === "aufwand") aufwand += p.betrag
  }
  return { ertrag: round2(ertrag), aufwand: round2(aufwand), ergebnis: round2(ertrag - aufwand) }
}
