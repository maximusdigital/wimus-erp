/**
 * GuV-/BWA-Kurzform aus FiBu-Buchungen (Spec 0002, 40_design §5 – Reporting).
 * Heuristik SKR03: Konten 4xxx = Aufwand (gebucht im Soll), 8xxx = Ertrag
 * (gebucht im Haben). Rein/testbar. Kein testierter Abschluss (Controlling).
 */

export type GuvBuchung = {
  soll_konto: string | null
  haben_konto: string | null
  betrag_brutto: number | null
}

export type GuvZeile = { konto: string; betrag: number }

export type GuvErgebnis = {
  ertraege: GuvZeile[]
  aufwendungen: GuvZeile[]
  summe_ertrag: number
  summe_aufwand: number
  ergebnis: number
}

/** SKR03-Kontoklasse grob. */
export function kontoGruppe(konto: string | null): "aufwand" | "ertrag" | "neutral" {
  if (!konto) return "neutral"
  if (/^4/.test(konto)) return "aufwand"
  if (/^8/.test(konto)) return "ertrag"
  return "neutral"
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function aggregateGuV(buchungen: GuvBuchung[]): GuvErgebnis {
  const aufwand = new Map<string, number>()
  const ertrag = new Map<string, number>()

  for (const b of buchungen) {
    const betrag = b.betrag_brutto ?? 0
    if (kontoGruppe(b.soll_konto) === "aufwand") {
      aufwand.set(b.soll_konto!, (aufwand.get(b.soll_konto!) ?? 0) + betrag)
    }
    if (kontoGruppe(b.haben_konto) === "ertrag") {
      ertrag.set(b.haben_konto!, (ertrag.get(b.haben_konto!) ?? 0) + betrag)
    }
  }

  const toZeilen = (m: Map<string, number>): GuvZeile[] =>
    [...m.entries()]
      .map(([konto, betrag]) => ({ konto, betrag: round2(betrag) }))
      .sort((a, b) => a.konto.localeCompare(b.konto))

  const ertraege = toZeilen(ertrag)
  const aufwendungen = toZeilen(aufwand)
  const summe_ertrag = round2(ertraege.reduce((s, z) => s + z.betrag, 0))
  const summe_aufwand = round2(aufwendungen.reduce((s, z) => s + z.betrag, 0))

  return {
    ertraege,
    aufwendungen,
    summe_ertrag,
    summe_aufwand,
    ergebnis: round2(summe_ertrag - summe_aufwand),
  }
}
