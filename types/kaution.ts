/** Kaution – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Kaution = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  mietvertrag_id: string | null
  bankkonto_id: string | null
  betrag: number | null
  anlage_art: string | null
  zinssatz: number | null
  zinsen_kumuliert: number | null
  status: string
  rueckzahlung_datum: string | null
}

/** Kaution inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type KautionMitRelationen = Kaution & {
  vertrag: { aktenzeichen: string | null } | null
}

export const KAUTION_ANLAGE_ARTEN = [
  "sparbuch",
  "mietkautionskonto",
  "buergschaft",
  "bar",
] as const

export const KAUTION_ANLAGE_ART_LABELS: Record<string, string> = {
  sparbuch: "Sparbuch",
  mietkautionskonto: "Mietkautionskonto",
  buergschaft: "Bürgschaft",
  bar: "Barkaution",
}

export const KAUTION_STATUS = [
  "angelegt",
  "hinterlegt",
  "abgerechnet",
  "ausgezahlt",
] as const

export const KAUTION_STATUS_LABELS: Record<string, string> = {
  angelegt: "Angelegt",
  hinterlegt: "Hinterlegt",
  abgerechnet: "Abgerechnet",
  ausgezahlt: "Ausgezahlt",
}

/** Badge-Variante je Status. */
export const KAUTION_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  angelegt: "secondary",
  hinterlegt: "default",
  abgerechnet: "outline",
  ausgezahlt: "outline",
}
