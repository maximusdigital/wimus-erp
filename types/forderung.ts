/** Forderung – Datentyp + Auswahl-Konstanten (Spec 0001, wimus.forderungen). */

export type Forderung = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  kontakt_id: string
  mietvertrag_id: string | null
  einheit_id: string | null
  forderung_typ: string
  schaden_typ: string | null
  betrag: number
  faellig_am: string
  bezahlt_am: string | null
  bezahlt_betrag: number | null
  status: string
  mahnstufe: number | null
  kaution_verrechnet: boolean | null
  kaution_betrag: number | null
  aktenzeichen: string | null
  notiz: string | null
}

export type ForderungMitRelationen = Forderung & {
  kontakt: {
    vorname: string | null
    nachname: string | null
    firmenname: string | null
  } | null
  mietvertrag: { aktenzeichen: string | null } | null
}

/** Forderungsarten (Spec 30_prozesse Kap. 3). */
export const FORDERUNG_TYPEN = [
  "miete",
  "bk_nachzahlung",
  "sachschaden",
  "reinigung_zusatz",
  "nutzungsausfall",
  "mietausfall",
  "renovierungskosten",
  "hausgeld",
  "citytax",
] as const

export const FORDERUNG_TYP_LABELS: Record<string, string> = {
  miete: "Miete",
  bk_nachzahlung: "BK-Nachzahlung",
  sachschaden: "Sachschaden",
  reinigung_zusatz: "Reinigung (Zusatz)",
  nutzungsausfall: "Nutzungsausfall",
  mietausfall: "Mietausfall",
  renovierungskosten: "Renovierungskosten",
  hausgeld: "Hausgeld",
  citytax: "CityTax",
}

export const FORDERUNG_STATUS = [
  "offen",
  "teilbezahlt",
  "bezahlt",
  "kaution_verrechnet",
  "mahnung",
  "abgeschrieben",
] as const

export const FORDERUNG_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  teilbezahlt: "Teilbezahlt",
  bezahlt: "Bezahlt",
  kaution_verrechnet: "Kaution verrechnet",
  mahnung: "In Mahnung",
  abgeschrieben: "Abgeschrieben",
}
