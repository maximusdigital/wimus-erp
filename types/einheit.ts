/** Einheit – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Einheit = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  objekt_id: string
  bezeichnung: string | null
  lage: string | null
  verwendungszweck_code: string | null
  einheitstyp: string | null
  wohnflaeche_qm: number | null
  zimmer_anzahl: number | null
  etage: string | null
  status: string
}

/** Einheit inkl. Objekt-Kurzinfo (Supabase: objekte(kuerzel, bezeichnung)). */
export type EinheitMitObjekt = Einheit & {
  objekte: { kuerzel: string; bezeichnung: string | null } | null
}

/** Objekt-Auswahloption für das Einheiten-Formular. */
export type ObjektOption = {
  id: string
  kuerzel: string
  bezeichnung: string | null
}

export const EINHEITSTYPEN = [
  "wohnung",
  "zimmer",
  "gewerbe",
  "stellplatz",
  "garage",
] as const

export const EINHEITSTYP_LABELS: Record<string, string> = {
  wohnung: "Wohnung",
  zimmer: "Zimmer",
  gewerbe: "Gewerbe",
  stellplatz: "Stellplatz",
  garage: "Garage",
}

export const EINHEIT_STATUS = [
  "frei",
  "vermietet",
  "eigennutzung",
  "sanierung",
] as const

export const EINHEIT_STATUS_LABELS: Record<string, string> = {
  frei: "Frei",
  vermietet: "Vermietet",
  eigennutzung: "Eigennutzung",
  sanierung: "Sanierung",
}

/** Badge-Variante je Status. */
export const EINHEIT_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  frei: "secondary",
  vermietet: "default",
  eigennutzung: "outline",
  sanierung: "destructive",
}
