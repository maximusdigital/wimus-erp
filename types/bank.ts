/** Bank-Abgleich (FiBu 0002) – Typen + Anzeige-Konstanten. */

export type BankKonto = {
  id: string
  bezeichnung: string
  iban: string | null
  bank: string | null
  aktiv: boolean
}

export type BankUmsatzRow = {
  id: string
  wertstellung: string
  empfaenger: string | null
  verwendungszweck: string | null
  kategorie_wiso: string | null
  betrag: number
  richtung: "einnahme" | "ausgabe"
  erkanntes_k1: string | null
  mietvertrag_id: string | null
  match_methode: string | null
  match_confidence: number | null
  zuordnung_status: string
  forderung_id: string | null
  objekt?: { kuerzel: string | null } | null
  einheit?: { verwendungszweck_code: string | null } | null
}

export type VertragOption = { id: string; label: string }

export type BankEinstellungen = {
  auto_schwelle: number
  pruefen_schwelle: number
  name_min: number
}

export type IgnorierMuster = { id: string; muster: string; aktiv: boolean }

export const BANK_STATUS_LABELS: Record<string, string> = {
  offen: "Offen / Klären",
  zugeordnet: "Zugeordnet",
  teilweise: "Teilweise",
  manuell: "Manuell",
  ignoriert: "Ignoriert",
}

export const BANK_STATUS_CLASS: Record<string, string> = {
  offen: "bg-warning/10 text-warning",
  zugeordnet: "bg-success/10 text-success",
  teilweise: "bg-secondary/10 text-secondary",
  manuell: "bg-secondary/10 text-secondary",
  ignoriert: "bg-muted text-muted-foreground",
}
