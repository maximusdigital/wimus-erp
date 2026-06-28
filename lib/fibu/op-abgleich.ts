/**
 * OP-Abgleich (Spec 0002): zugeordnete Einnahme gegen offene `forderung` (typ=miete).
 * KEIN neues OP-Modell — `forderungen` bleibt die Sollstellung; hier nur die reine
 * Verrechnungslogik (voll / Teilzahlung / Überzahlung). Mahnwesen bleibt unberührt;
 * Zahlungseingang stoppt die Mahnung über den neuen Status.
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type ForderungOffen = {
  id: string
  betrag: number
  bezahlt_betrag: number | null
}

export type OpErgebnis = {
  forderung_id: string | null
  /** Neuer kumulierter Bezahlt-Betrag der Forderung. */
  neuer_bezahlt_betrag: number
  neuer_status: "offen" | "teilbezahlt" | "bezahlt"
  /** Auf die Forderung angerechneter Betrag. */
  verbucht: number
  /** Überzahlung (Mieter-Guthaben). */
  guthaben: number
  art: "vollstaendig" | "teilzahlung" | "ueberzahlung" | "keine_forderung"
}

/**
 * Rechnet eine Einnahme auf eine offene Forderung an.
 * @param betrag  Zahlungsbetrag (positiv; Vorzeichen wird ignoriert).
 * @param forderung offene Miete-Forderung oder null (kein Soll vorhanden).
 */
export function abgleicheEinnahme(
  betrag: number,
  forderung: ForderungOffen | null
): OpErgebnis {
  const zahlung = round2(Math.abs(betrag))
  if (!forderung) {
    return {
      forderung_id: null,
      neuer_bezahlt_betrag: 0,
      neuer_status: "offen",
      verbucht: 0,
      guthaben: zahlung,
      art: "keine_forderung",
    }
  }

  const soll = round2(forderung.betrag ?? 0)
  const bisher = round2(forderung.bezahlt_betrag ?? 0)
  const offen = round2(soll - bisher)
  const verbucht = round2(Math.min(zahlung, Math.max(offen, 0)))
  const neuerBezahlt = round2(bisher + verbucht)
  const guthaben = round2(zahlung - verbucht)

  const neuerStatus: OpErgebnis["neuer_status"] =
    neuerBezahlt >= soll ? "bezahlt" : neuerBezahlt > 0 ? "teilbezahlt" : "offen"

  const art: OpErgebnis["art"] =
    guthaben > 0 ? "ueberzahlung" : verbucht >= offen ? "vollstaendig" : "teilzahlung"

  return {
    forderung_id: forderung.id,
    neuer_bezahlt_betrag: neuerBezahlt,
    neuer_status: neuerStatus,
    verbucht,
    guthaben,
    art,
  }
}

export type Allokation = {
  forderung_id: string
  neuer_bezahlt_betrag: number
  neuer_status: "offen" | "teilbezahlt" | "bezahlt"
  verbucht: number
}

export type VerteilErgebnis = {
  allokationen: Allokation[]
  /** Verbleibendes Mieter-Guthaben nach Verteilung. */
  guthaben: number
  verbucht_gesamt: number
}

/**
 * Verteilt eine Einnahme über mehrere offene Forderungen (Kontokorrent/FIFO).
 * `forderungen` muss bereits in der gewünschten Reihenfolge stehen (älteste zuerst).
 * Überzahlung bedient die nächste offene Forderung; verbleibender Rest → Guthaben.
 */
export function verteileEinnahme(
  betrag: number,
  forderungen: ForderungOffen[]
): VerteilErgebnis {
  let rest = round2(Math.abs(betrag))
  const allokationen: Allokation[] = []
  for (const f of forderungen) {
    if (rest <= 0) break
    const r = abgleicheEinnahme(rest, f)
    if (r.verbucht > 0) {
      allokationen.push({
        forderung_id: f.id,
        neuer_bezahlt_betrag: r.neuer_bezahlt_betrag,
        neuer_status: r.neuer_status,
        verbucht: r.verbucht,
      })
      rest = round2(rest - r.verbucht)
    }
  }
  return {
    allokationen,
    guthaben: round2(rest),
    verbucht_gesamt: round2(Math.abs(betrag) - rest),
  }
}
