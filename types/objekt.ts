/** Objekt – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Objekt = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  gesellschaft_id: string | null
  kuerzel: string
  bezeichnung: string | null
  strasse: string | null
  hausnummer: string | null
  plz: string | null
  ort: string | null
  objekttyp: string | null
  baujahr: number | null
  wohnflaeche_qm: number | null
  grundstuecksflaeche_qm: number | null
  nutzen_lasten_datum: string | null
  notartermin_datum: string | null
  haltestrategie: string | null
  marktwert_sprengnetter: number | null
  marktwert_pricehubble: number | null
  status: string
  notiz: string | null
}

/** Objekt inkl. Einheiten-Zähler (Supabase: einheiten(count)). */
export type ObjektMitEinheiten = Objekt & {
  einheiten: { count: number }[]
}

export const OBJEKTTYPEN = [
  "EW",
  "MFH",
  "EFH",
  "R2R-KZV",
  "Gewerbe",
  "Sonstiges",
] as const

export const OBJEKTTYP_LABELS: Record<string, string> = {
  EW: "Eigentumswohnung",
  MFH: "Mehrfamilienhaus",
  EFH: "Einfamilienhaus",
  "R2R-KZV": "Rent2Rent / KZV",
  Gewerbe: "Gewerbe",
  Sonstiges: "Sonstiges",
}

export const HALTESTRATEGIEN = [
  "bestand",
  "r2r",
  "flip",
  "development",
] as const

export const HALTESTRATEGIE_LABELS: Record<string, string> = {
  bestand: "Bestand",
  r2r: "Rent2Rent",
  flip: "Flip",
  development: "Development",
}

export const OBJEKT_STATUS = ["ist", "akquise", "verkauft"] as const

export const OBJEKT_STATUS_LABELS: Record<string, string> = {
  ist: "Bestand",
  akquise: "Akquise",
  verkauft: "Verkauft",
}

/** Badge-Variante je Status. */
export const OBJEKT_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ist: "default",
  akquise: "secondary",
  verkauft: "outline",
}
