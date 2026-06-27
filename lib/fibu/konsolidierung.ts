/**
 * Konsolidierte GuV über mehrere Einheiten/Buchungskreise (Spec 0002, 40_design §5).
 * Baut aus den je-Firma-GuVs eine Matrix: Konto-Zeilen × Firma-Spalten + Summe.
 * Rein/testbar (DB-frei). Heuristik wie `aggregateGuV` (SKR03).
 */
import { aggregateGuV, type GuvBuchung } from "@/lib/fibu/guv"

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
