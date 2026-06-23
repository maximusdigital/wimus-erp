/** Kontakt – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Kontakt = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  typ: string
  anrede: string | null
  vorname: string | null
  nachname: string | null
  firma: string | null
  email: string | null
  telefon: string | null
  strasse: string | null
  plz: string | null
  ort: string | null
  ausweis_nr: string | null
  dsgvo_datenweitergabe: boolean
  dsgvo_einwilligung_am: string | null
  notiz: string | null
}

export const KONTAKT_TYPEN = [
  "mieter",
  "eigentuemer",
  "dienstleister",
  "glaeubiger",
  "gast",
  "behoerde",
] as const

export const KONTAKT_TYP_LABELS: Record<string, string> = {
  mieter: "Mieter",
  eigentuemer: "Eigentümer",
  dienstleister: "Dienstleister",
  glaeubiger: "Gläubiger",
  gast: "Gast",
  behoerde: "Behörde",
}

/** Badge-Variante je Typ. */
export const KONTAKT_TYP_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  mieter: "default",
  eigentuemer: "secondary",
  dienstleister: "outline",
  glaeubiger: "destructive",
  gast: "outline",
  behoerde: "outline",
}

// Design System 40 / Datenmodell v5: Anrede ausschliesslich Herr/Frau/Firma/Keine.
export const ANREDEN = ["Herr", "Frau", "Firma", "Keine"] as const

/** Anzeigename: Firma oder Vor-/Nachname, Fallback E-Mail. */
export function kontaktName(k: {
  firma: string | null
  vorname: string | null
  nachname: string | null
  email?: string | null
}): string {
  const person = [k.vorname, k.nachname].filter(Boolean).join(" ").trim()
  return k.firma || person || k.email || "Kontakt"
}
