/** Gesellschafter + Beteiligungen (Spec 0002, wimus.gesellschafter / wimus.beteiligungen). */

export type Gesellschafter = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  name: string
  typ: string
  steuerliche_id: string | null
  strasse: string | null
  hausnummer: string | null
  plz: string | null
  stadt: string | null
  land: string | null
  aktiv: boolean
}

export type Beteiligung = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  gesellschafter_id: string
  firma_id: string
  /** Quote als Bruchteil 0..1 (DB CHECK). */
  quote: number
  gueltig_ab: string
  gueltig_bis: string | null
}

/** Beteiligung mit eingebetteter Firma (für Listen). */
export type BeteiligungMitFirma = Beteiligung & {
  firma?: { id: string; name: string; kuerzel: string | null } | null
}

export const GESELLSCHAFTER_TYPEN = [
  "natuerliche_person",
  "juristische_person",
] as const

export const GESELLSCHAFTER_TYP_LABELS: Record<string, string> = {
  natuerliche_person: "Natürliche Person",
  juristische_person: "Juristische Person",
}
