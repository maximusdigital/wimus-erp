/**
 * BK-Abrechnungslauf (Spec 0001 / 30_prozesse Kap. 1).
 *
 * Verteilt die Kostenpositionen einer Periode über die Mitglieder einer
 * Abrechnungseinheit und bildet je Mietvertrag den Kostenanteil + Saldo
 * (Vorauszahlung − Kostenanteil). Reine Funktion, baut auf verteileKosten auf.
 */
import { verteileKosten, type BkMitglied, type Umlageschluessel } from "@/lib/utils/bk"

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type BkPosition = {
  id: string
  bk_art_id: string
  betrag: number
  /** Umlageschlüssel dieser Position (sonst Standard der Abrechnungseinheit). */
  schluessel?: Umlageschluessel | null
}

export type BkAbrechnungMitglied = BkMitglied & {
  /** Vorauszahlung der Periode (z.B. monatl. BK-Pauschale × Monate). */
  vorauszahlung?: number | null
}

export type BkAbrechnungZeile = {
  id: string
  kostenAnteil: number
  vorauszahlung: number
  /** > 0: Guthaben (Rückzahlung), < 0: Nachzahlung. */
  saldo: number
  positionen: { bk_art_id: string; betrag: number }[]
}

export type BkAbrechnungErgebnis = {
  kostenGesamt: number
  vorauszahlungGesamt: number
  zeilen: BkAbrechnungZeile[]
}

/**
 * Erstellt die Abrechnung für eine Abrechnungseinheit.
 * @param standardSchluessel Fallback-Schlüssel, wenn die Position keinen hat.
 */
export function erstelleAbrechnung(
  positionen: BkPosition[],
  mitglieder: BkAbrechnungMitglied[],
  standardSchluessel: Umlageschluessel
): BkAbrechnungErgebnis {
  const anteile = new Map<string, number>()
  const breakdown = new Map<string, { bk_art_id: string; betrag: number }[]>()
  for (const m of mitglieder) {
    anteile.set(m.id, 0)
    breakdown.set(m.id, [])
  }

  for (const pos of positionen) {
    const schluessel = pos.schluessel ?? standardSchluessel
    const verteilung = verteileKosten(pos.betrag, mitglieder, schluessel)
    for (const v of verteilung) {
      if (v.betrag === 0) continue
      anteile.set(v.id, round2((anteile.get(v.id) ?? 0) + v.betrag))
      breakdown.get(v.id)!.push({ bk_art_id: pos.bk_art_id, betrag: v.betrag })
    }
  }

  const zeilen: BkAbrechnungZeile[] = mitglieder.map((m) => {
    const kostenAnteil = round2(anteile.get(m.id) ?? 0)
    const vorauszahlung = round2(m.vorauszahlung ?? 0)
    return {
      id: m.id,
      kostenAnteil,
      vorauszahlung,
      saldo: round2(vorauszahlung - kostenAnteil),
      positionen: breakdown.get(m.id) ?? [],
    }
  })

  return {
    kostenGesamt: round2(positionen.reduce((s, p) => s + p.betrag, 0)),
    vorauszahlungGesamt: round2(
      mitglieder.reduce((s, m) => s + (m.vorauszahlung ?? 0), 0)
    ),
    zeilen,
  }
}
