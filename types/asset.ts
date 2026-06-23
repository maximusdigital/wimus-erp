/** Asset-Register / Inventar – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Asset = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  objekt_id: string | null
  einheit_id: string | null
  bezeichnung: string
  typ: string | null
  asset_code: string | null
  zustand: string | null
  standort_typ: string | null
  anschaffung_am: string | null
  anschaffung_wert: number | null
}

/** Asset inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type AssetMitRelationen = Asset & {
  objekt: { kuerzel: string } | null
  einheit: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
}

/** Auswahloptionen für das Asset-Formular. */
export type ObjektRef = { id: string; kuerzel: string; bezeichnung: string | null }
export type EinheitRef = { id: string; objekt_id: string; label: string }

// ---------------------------------------------------------------------------
// Typ
// ---------------------------------------------------------------------------
export const ASSET_TYPEN = [
  "moebel",
  "geraet",
  "schluessel",
  "smart_device",
  "werkzeug",
  "fahrzeug",
  "sonstiges",
] as const

export const ASSET_TYP_LABELS: Record<string, string> = {
  moebel: "Möbel",
  geraet: "Gerät",
  schluessel: "Schlüssel",
  smart_device: "Smart Device",
  werkzeug: "Werkzeug",
  fahrzeug: "Fahrzeug",
  sonstiges: "Sonstiges",
}

// ---------------------------------------------------------------------------
// Zustand
// ---------------------------------------------------------------------------
export const ASSET_ZUSTAND = ["neu", "gut", "gebraucht", "defekt"] as const

export const ASSET_ZUSTAND_LABELS: Record<string, string> = {
  neu: "Neu",
  gut: "Gut",
  gebraucht: "Gebraucht",
  defekt: "Defekt",
}

export const ASSET_ZUSTAND_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  neu: "default",
  gut: "secondary",
  gebraucht: "outline",
  defekt: "destructive",
}

// ---------------------------------------------------------------------------
// Standort-Typ
// ---------------------------------------------------------------------------
export const ASSET_STANDORT_TYP = [
  "objekt",
  "einheit",
  "lager",
  "unterwegs",
] as const

export const ASSET_STANDORT_TYP_LABELS: Record<string, string> = {
  objekt: "Objekt",
  einheit: "Einheit",
  lager: "Lager",
  unterwegs: "Unterwegs",
}

/** Anzeige-Label für die verknüpfte Einheit. */
export function einheitLabel(
  einheit: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
): string | null {
  if (!einheit) return null
  return einheit.verwendungszweck_code ?? einheit.bezeichnung ?? null
}
