/** Beleg / Buchung (Spec 0002, wimus.belege / wimus.buchungen). */

export type Beleg = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  firma_id: string | null
  ist_erechnung: boolean
  kanal: string | null
  klasse: string | null
  belegnummer: string | null
  belegdatum: string | null
  faelligkeitsdatum: string | null
  lieferant_id: string | null
  lieferant_name: string | null
  lieferant_ustid: string | null
  iban: string | null
  gewerk: string | null
  netto: number | null
  brutto: number | null
  ust_satz: number | null
  ust_betrag: number | null
  soll_konto: string | null
  steuerschluessel: string | null
  k1: string | null
  k2: string | null
  confidence_ocr: number | null
  confidence_extraktion: number | null
  confidence_kontierung: number | null
  review_flag: boolean
  review_gruende: string[] | null
  status: string
  version: number
}

export type BelegMitFirma = Beleg & {
  firma?: { id: string; name: string; kuerzel: string | null } | null
}

export const BELEG_STATUS_LABELS: Record<string, string> = {
  eingegangen: "Eingegangen",
  einheit_zugeordnet: "Einheit zugeordnet",
  ocr_ok: "OCR ok",
  extrahiert: "Extrahiert",
  validiert: "Validiert",
  freigabe_offen: "Freigabe offen",
  gebucht: "Gebucht",
  exportiert: "Exportiert",
  fehler: "Fehler",
  dublette: "Dublette",
  abgelehnt: "Abgelehnt",
}
