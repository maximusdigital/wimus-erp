/** Vorgang (P14) – Datentyp + Auswahl-Konstanten (clientseitig nutzbar). */

export type Vorgang = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  objekt_id: string | null
  einheit_id: string | null
  titel: string
  beschreibung: string | null
  typ: string | null
  prioritaet: string
  kostentraeger: string | null
  faellig_am: string | null
  status: string
}

/** Vorgang inkl. verknüpfter Kurzinfos (Supabase-Embeds mit Alias). */
export type VorgangMitRelationen = Vorgang & {
  objekt: { kuerzel: string } | null
  einheit: {
    verwendungszweck_code: string | null
    bezeichnung: string | null
  } | null
}

/** Auswahloptionen für das Vorgangs-Formular. */
export type ObjektRef = { id: string; kuerzel: string; bezeichnung: string | null }
export type EinheitRef = { id: string; objekt_id: string; label: string }

// ---------------------------------------------------------------------------
// Typ
// ---------------------------------------------------------------------------
export const VORGANG_TYPEN = [
  "schaden",
  "reparatur",
  "anfrage",
  "kuendigung",
  "sonstiges",
] as const

export const VORGANG_TYP_LABELS: Record<string, string> = {
  schaden: "Schaden",
  reparatur: "Reparatur",
  anfrage: "Anfrage",
  kuendigung: "Kündigung",
  sonstiges: "Sonstiges",
}

// ---------------------------------------------------------------------------
// Priorität
// ---------------------------------------------------------------------------
export const VORGANG_PRIORITAET = [
  "niedrig",
  "normal",
  "hoch",
  "kritisch",
] as const

export const VORGANG_PRIORITAET_LABELS: Record<string, string> = {
  niedrig: "Niedrig",
  normal: "Normal",
  hoch: "Hoch",
  kritisch: "Kritisch",
}

export const VORGANG_PRIORITAET_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  niedrig: "outline",
  normal: "secondary",
  hoch: "default",
  kritisch: "destructive",
}

/** Sortier-Rang der Priorität: kritisch zuerst. */
export const VORGANG_PRIORITAET_RANG: Record<string, number> = {
  kritisch: 0,
  hoch: 1,
  normal: 2,
  niedrig: 3,
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export const VORGANG_STATUS = [
  "offen",
  "in_arbeit",
  "wartet",
  "erledigt",
  "abgebrochen",
] as const

export const VORGANG_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  wartet: "Wartet",
  erledigt: "Erledigt",
  abgebrochen: "Abgebrochen",
}

export const VORGANG_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  offen: "default",
  in_arbeit: "secondary",
  wartet: "outline",
  erledigt: "outline",
  abgebrochen: "destructive",
}

// ---------------------------------------------------------------------------
// Kostenträger
// ---------------------------------------------------------------------------
export const VORGANG_KOSTENTRAEGER = [
  "vermieter",
  "mieter",
  "versicherung",
  "weg",
] as const

export const VORGANG_KOSTENTRAEGER_LABELS: Record<string, string> = {
  vermieter: "Vermieter",
  mieter: "Mieter",
  versicherung: "Versicherung",
  weg: "WEG",
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
