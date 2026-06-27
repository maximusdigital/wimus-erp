/**
 * Konsolidierte GuV über mehrere Einheiten/Buchungskreise (Spec 0002, 40_design §5).
 * Baut aus den je-Firma-GuVs eine Matrix: Konto-Zeilen × Firma-Spalten + Summe.
 * Rein/testbar (DB-frei). Heuristik wie `aggregateGuV` (SKR03).
 */
import { aggregateGuV, type GuvBuchung } from "@/lib/fibu/guv"
import {
  aggregateNachPosition,
  summeJeArt,
  type PositionArt,
  type TaxonomiePosition,
} from "@/lib/fibu/taxonomie"

export type FirmaBuchungen = {
  firmaId: string
  firmaName: string
  buchungen: GuvBuchung[]
}

export type KonsoSpalte = {
  firmaId: string
  firmaName: string
  summe_ertrag: number
  summe_aufwand: number
  ergebnis: number
}

export type KonsoZeile = {
  konto: string
  /** Betrag je Firma-ID (fehlende = 0). */
  werte: Record<string, number>
  summe: number
}

export type KonsoErgebnis = {
  spalten: KonsoSpalte[]
  ertraege: KonsoZeile[]
  aufwendungen: KonsoZeile[]
  summe_ertrag: number
  summe_aufwand: number
  ergebnis: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Baut eine Matrix-Zeilenliste aus je-Firma-Zeilen (konto → betrag). */
function matrix(
  perFirma: { firmaId: string; zeilen: { konto: string; betrag: number }[] }[]
): KonsoZeile[] {
  const konten = new Set<string>()
  for (const f of perFirma) for (const z of f.zeilen) konten.add(z.konto)

  return [...konten]
    .sort((a, b) => a.localeCompare(b))
    .map((konto) => {
      const werte: Record<string, number> = {}
      let summe = 0
      for (const f of perFirma) {
        const betrag = f.zeilen.find((z) => z.konto === konto)?.betrag ?? 0
        werte[f.firmaId] = round2(betrag)
        summe += betrag
      }
      return { konto, werte, summe: round2(summe) }
    })
}

export function konsolidiereGuV(firmen: FirmaBuchungen[]): KonsoErgebnis {
  const guvs = firmen.map((f) => ({ ...f, guv: aggregateGuV(f.buchungen) }))

  const spalten: KonsoSpalte[] = guvs.map((g) => ({
    firmaId: g.firmaId,
    firmaName: g.firmaName,
    summe_ertrag: g.guv.summe_ertrag,
    summe_aufwand: g.guv.summe_aufwand,
    ergebnis: g.guv.ergebnis,
  }))

  const ertraege = matrix(
    guvs.map((g) => ({ firmaId: g.firmaId, zeilen: g.guv.ertraege }))
  )
  const aufwendungen = matrix(
    guvs.map((g) => ({ firmaId: g.firmaId, zeilen: g.guv.aufwendungen }))
  )

  const summe_ertrag = round2(spalten.reduce((s, c) => s + c.summe_ertrag, 0))
  const summe_aufwand = round2(spalten.reduce((s, c) => s + c.summe_aufwand, 0))

  return {
    spalten,
    ertraege,
    aufwendungen,
    summe_ertrag,
    summe_aufwand,
    ergebnis: round2(summe_ertrag - summe_aufwand),
  }
}

// ---------------------------------------------------------------------
// Konsolidierung NACH Berichtsposition (Taxonomie) statt rohen Konten
// ---------------------------------------------------------------------

export type KonsoPositionZeile = {
  position_code: string
  bezeichnung: string
  art: PositionArt
  werte: Record<string, number>
  summe: number
}

export type KonsoPositionErgebnis = {
  spalten: KonsoSpalte[]
  ertraege: KonsoPositionZeile[]
  aufwendungen: KonsoPositionZeile[]
  summe_ertrag: number
  summe_aufwand: number
  ergebnis: number
  /** Nicht zugeordnete Beträge je Einheit (Konten ohne Berichtsposition). */
  nichtZugeordnet: { firmaId: string; firmaName: string; betrag: number }[]
}

/**
 * Wie `konsolidiereGuV`, aber die Zeilen sind Berichtspositionen (Taxonomie):
 * je Einheit werden die Konten erst auf Positionen gemappt, dann über die
 * Einheiten zur Matrix verdichtet. `art` der Position steuert Ertrag/Aufwand.
 */
export function konsolidiereNachPosition(
  firmen: FirmaBuchungen[],
  positionen: TaxonomiePosition[]
): KonsoPositionErgebnis {
  const perFirma = firmen.map((f) => {
    const guv = aggregateGuV(f.buchungen)
    const tax = aggregateNachPosition([...guv.ertraege, ...guv.aufwendungen], positionen)
    return {
      firmaId: f.firmaId,
      firmaName: f.firmaName,
      positionen: tax.positionen,
      summen: summeJeArt(tax.positionen),
      nichtZugeordnet: round2(tax.nichtZugeordnet.reduce((s, z) => s + z.betrag, 0)),
    }
  })

  const spalten: KonsoSpalte[] = perFirma.map((f) => ({
    firmaId: f.firmaId,
    firmaName: f.firmaName,
    summe_ertrag: f.summen.ertrag,
    summe_aufwand: f.summen.aufwand,
    ergebnis: f.summen.ergebnis,
  }))

  // Positions-Metadaten (bezeichnung/art) über alle Einheiten sammeln.
  const meta = new Map<string, { bezeichnung: string; art: PositionArt }>()
  for (const f of perFirma) {
    for (const p of f.positionen) {
      if (!meta.has(p.position_code)) meta.set(p.position_code, { bezeichnung: p.bezeichnung, art: p.art })
    }
  }

  function zeilen(art: PositionArt): KonsoPositionZeile[] {
    return [...meta.entries()]
      .filter(([, m]) => m.art === art)
      .map(([code, m]) => {
        const werte: Record<string, number> = {}
        let summe = 0
        for (const f of perFirma) {
          const betrag = f.positionen.find((p) => p.position_code === code)?.betrag ?? 0
          werte[f.firmaId] = round2(betrag)
          summe += betrag
        }
        return { position_code: code, bezeichnung: m.bezeichnung, art, werte, summe: round2(summe) }
      })
      .sort((a, b) => a.position_code.localeCompare(b.position_code))
  }

  const summe_ertrag = round2(spalten.reduce((s, c) => s + c.summe_ertrag, 0))
  const summe_aufwand = round2(spalten.reduce((s, c) => s + c.summe_aufwand, 0))

  return {
    spalten,
    ertraege: zeilen("ertrag"),
    aufwendungen: zeilen("aufwand"),
    summe_ertrag,
    summe_aufwand,
    ergebnis: round2(summe_ertrag - summe_aufwand),
    nichtZugeordnet: perFirma
      .filter((f) => f.nichtZugeordnet !== 0)
      .map((f) => ({ firmaId: f.firmaId, firmaName: f.firmaName, betrag: f.nichtZugeordnet })),
  }
}
