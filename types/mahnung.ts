/** Mahnung – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Mahnung = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  vertrag_id: string | null
  mieter_id: string | null
  stufe: number
  hauptforderung: number | null
  zinsen: number | null
  gebuehren: number | null
  gesamt: number | null
  faellig_am: string | null
  versendet_am: string | null
  status: string
}

/** Mahnung inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type MahnungMitRelationen = Mahnung & {
  vertrag: { vertragsnummer: string | null } | null
  mieter: { vorname: string | null; nachname: string | null; firma: string | null } | null
}

export const MAHN_STUFEN = [1, 2, 3, 4, 5] as const

export const MAHN_STUFE_LABELS: Record<number, string> = {
  1: "Zahlungserinnerung",
  2: "1. Mahnung",
  3: "2. Mahnung",
  4: "Letzte Mahnung",
  5: "Inkasso",
}

export const MAHN_STATUS = [
  "offen",
  "versendet",
  "bezahlt",
  "inkasso",
  "erledigt",
] as const

export const MAHN_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  versendet: "Versendet",
  bezahlt: "Bezahlt",
  inkasso: "Inkasso",
  erledigt: "Erledigt",
}

/** Badge-Variante je Status. */
export const MAHN_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  offen: "secondary",
  versendet: "default",
  bezahlt: "outline",
  inkasso: "destructive",
  erledigt: "outline",
}

/** Gesamtforderung = Hauptforderung + Zinsen + Gebühren. */
export function mahnungGesamt(m: {
  hauptforderung: number | null
  zinsen: number | null
  gebuehren: number | null
}): number {
  return (m.hauptforderung ?? 0) + (m.zinsen ?? 0) + (m.gebuehren ?? 0)
}
