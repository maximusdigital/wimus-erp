/** Einheit – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Einheit = {
  id: string
  created_at: string
  updated_at: string
  objekt_id: string
  kuerzel: string | null
  bezeichnung: string | null
  lage: string | null
  verwendungszweck_code: string | null
  typ: string | null
  flaeche: number | null
  zimmer: number | null
  schlafzimmer: number | null
  baeder: number | null
  etage_beschreibung: string | null
  aktiv: boolean
  // KZV / Keybox
  keybox_vorhanden: boolean | null
  keybox_pin_statisch: string | null
  keybox_standort: string | null
  max_personen: number | null
  anleitung_url: string | null
  gaestemappe_url_slug: string | null
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
