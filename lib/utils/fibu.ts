/**
 * FiBu-Kernlogik (Spec 0002). Reine Funktionen, testbar.
 *  - Ergebnisverteilung: periodengenau/zeitanteilig bei Quotenwechsel.
 *  - Kontierung: deterministischer Regel-Lookup (LLM nur bei Regellücke).
 *  - buchungsIdExtern: stabile ID für die TaxPool-Dublettenerkennung.
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Tage zwischen zwei ISO-Daten, inklusive Endtag (>= 0). */
function tageInklusive(von: string, bis: string): number {
  const a = new Date(von)
  const b = new Date(bis)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const d = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return d > 0 ? d : 0
}

function maxDate(a: string, b: string): string {
  return new Date(a) >= new Date(b) ? a : b
}
function minDate(a: string, b: string): string {
  return new Date(a) <= new Date(b) ? a : b
}

export type Beteiligung = {
  gesellschafter_id: string
  /** Quote als Bruchteil 0..1 (z.B. 0.5 = 50%). */
  quote: number
  gueltig_ab: string
  /** null = aktuell/offen → bis Periodenende. */
  gueltig_bis: string | null
}

export type Verteilungszeile = {
  gesellschafter_id: string
  /** Zeitgewichtete effektive Quote über die Periode (0..1). */
  effektiv_quote: number
  anteil_betrag: number
}

/**
 * Ergebnisverteilung periodengenau (Spec 0002 Decision 2026-06-25): jede
 * Beteiligung zählt zeitanteilig mit ihrer Quote über die Überlappung mit der
 * Periode. Rundungsrest landet beim letzten Gesellschafter → Summe = ergebnis.
 */
export function ergebnisverteilung(
  beteiligungen: Beteiligung[],
  ergebnis: number,
  periodeVon: string,
  periodeBis: string
): Verteilungszeile[] {
  const tageGesamt = tageInklusive(periodeVon, periodeBis)
  if (tageGesamt === 0) return []

  // Pro Gesellschafter zeitgewichtete Quote aufsummieren.
  const gewicht = new Map<string, number>()
  const reihenfolge: string[] = []
  for (const b of beteiligungen) {
    const bis = b.gueltig_bis ?? periodeBis
    const von = maxDate(periodeVon, b.gueltig_ab)
    const ueberlappBis = minDate(periodeBis, bis)
    if (new Date(von) > new Date(ueberlappBis)) continue
    const ueberlappTage = tageInklusive(von, ueberlappBis)
    const anteil = (ueberlappTage / tageGesamt) * b.quote
    if (!gewicht.has(b.gesellschafter_id)) reihenfolge.push(b.gesellschafter_id)
    gewicht.set(b.gesellschafter_id, (gewicht.get(b.gesellschafter_id) ?? 0) + anteil)
  }

  let verteilt = 0
  return reihenfolge.map((gid, i) => {
    const q = gewicht.get(gid) ?? 0
    const istLetzter = i === reihenfolge.length - 1
    const betrag = istLetzter
      ? round2(ergebnis - verteilt)
      : round2(q * ergebnis)
    verteilt = round2(verteilt + betrag)
    return {
      gesellschafter_id: gid,
      effektiv_quote: round2(q * 10000) / 10000,
      anteil_betrag: betrag,
    }
  })
}

export type Kontierungsregel = {
  id: string
  /** Match-Kriterium (gewerk/leistung oder Lieferant). */
  match: string
  soll_konto: string
  ust_satz: number | null
  steuerschluessel: string | null
  prioritaet: number
}

export type KontierungsErgebnis =
  | { matched: true; regel_id: string; soll_konto: string; ust_satz: number | null; steuerschluessel: string | null; review_flag: false }
  | { matched: false; review_flag: true }

/**
 * Deterministische Kontierung: erste Regel (nach Priorität) deren Match auf
 * das Beleg-Gewerk/den Lieferanten passt. Keine Regel → review_flag (LLM-Fallback
 * außerhalb dieser Funktion). SKR-Konten driften so nicht prompt-abhängig.
 */
export function kontiere(
  beleg: { gewerk?: string | null; lieferant?: string | null },
  regeln: Kontierungsregel[]
): KontierungsErgebnis {
  const heu = `${beleg.gewerk ?? ""} ${beleg.lieferant ?? ""}`.toLowerCase()
  const sortiert = [...regeln].sort((a, b) => a.prioritaet - b.prioritaet)
  for (const r of sortiert) {
    if (r.match && heu.includes(r.match.toLowerCase())) {
      return {
        matched: true,
        regel_id: r.id,
        soll_konto: r.soll_konto,
        ust_satz: r.ust_satz,
        steuerschluessel: r.steuerschluessel,
        review_flag: false,
      }
    }
  }
  return { matched: false, review_flag: true }
}

/**
 * Stabile, deterministische Buchungs-ID (für TaxPool-Dublettenerkennung).
 * Gleicher Beleg → gleiche ID, unabhängig von Reihenfolge/Zeitpunkt.
 */
export function buchungsIdExtern(beleg: {
  einheit_id: string
  belegnummer: string | null
  belegdatum: string | null
  betrag_brutto: number | null
}): string {
  const basis = [
    beleg.einheit_id,
    (beleg.belegnummer ?? "").trim().toLowerCase(),
    beleg.belegdatum ?? "",
    (beleg.betrag_brutto ?? 0).toFixed(2),
  ].join("|")
  // FNV-1a 32-bit Hash → hex (stabil, kein Krypto nötig).
  let h = 0x811c9dc5
  for (let i = 0; i < basis.length; i++) {
    h ^= basis.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return "WIMUS-" + (h >>> 0).toString(16).padStart(8, "0")
}
