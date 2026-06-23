/** Buchung (KZV) – Datentyp + Auswahl-Konstanten (clientseitig nutzbar).
 *
 * DB-Tabelle: public.buchungen_kzv (Schema public). UI-Routen: /buchungen.
 */

export type Buchung = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  einheit_id: string | null
  objekt_id: string | null
  gast_id: string | null
  beds24_id: string | null
  kanal: string | null
  checkin: string | null
  checkout: string | null
  personen: number | null
  nuki_code: string | null
  tuya_szene: string | null
  betrag: number | null
  city_tax: number | null
  status: string
  apartment_pin: string | null
  keybox_pin: string | null
  ust_prozent: number | null
  gaestemappe_token: string | null
  meldeschein_reisepass: string | null
}

/** Buchung inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type BuchungMitRelationen = Buchung & {
  einheit: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
  objekt: { kuerzel: string } | null
  gast: { vorname: string | null; nachname: string | null; firma: string | null } | null
}

export const KANAELE = ["airbnb", "booking", "direkt", "sonstige"] as const

export const KANAL_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  direkt: "Direkt",
  sonstige: "Sonstige",
}

export const BUCHUNG_STATUS = [
  "angefragt",
  "bestaetigt",
  "checked_in",
  "checked_out",
  "storniert",
] as const

export const BUCHUNG_STATUS_LABELS: Record<string, string> = {
  angefragt: "Angefragt",
  bestaetigt: "Bestätigt",
  checked_in: "Eingecheckt",
  checked_out: "Ausgecheckt",
  storniert: "Storniert",
}

/** Badge-Variante je Status. */
export const BUCHUNG_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  angefragt: "secondary",
  bestaetigt: "default",
  checked_in: "default",
  checked_out: "outline",
  storniert: "destructive",
}

// Helper `naechte` zur Anzeige aus citytax-Utils re-exportieren.
export { naechte } from "@/lib/utils/citytax"
