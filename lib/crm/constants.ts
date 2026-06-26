/**
 * CRM-Konstanten (Spec 0003). Quelle der Wahrheit für die Enum-Werte, die
 * auch in der Migration als CHECK-Constraints stehen.
 */

export const MARKEN = [
  { value: "hausverwaltung", label: "WIMUS Hausverwaltung" },
  { value: "alfa_apartments", label: "ALFA APARTMENTS" },
  { value: "alfa_campus", label: "ALFA CAMPUS" },
  { value: "alfa_development", label: "ALFA DEVELOPMENT" },
  { value: "uebergreifend", label: "Übergreifend" },
] as const
export type Marke = (typeof MARKEN)[number]["value"]

export const LEAD_QUELLEN = [
  { value: "manuell", label: "Manuell" },
  { value: "web_formular", label: "Web-Formular" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefon", label: "Telefon" },
  { value: "portal", label: "Portal" },
  { value: "email", label: "E-Mail" },
  { value: "sonstige", label: "Sonstige" },
] as const
export type LeadQuelle = (typeof LEAD_QUELLEN)[number]["value"]

export const LEAD_STATUS = ["neu", "qualifiziert", "konvertiert", "verworfen"] as const
export type LeadStatus = (typeof LEAD_STATUS)[number]

export const DEAL_STATUS = ["offen", "gewonnen", "verloren"] as const
export type DealStatus = (typeof DEAL_STATUS)[number]

export const AKTIVITAET_TYPEN = [
  { value: "anruf", label: "Anruf" },
  { value: "email", label: "E-Mail" },
  { value: "meeting", label: "Meeting" },
  { value: "aufgabe", label: "Aufgabe" },
  { value: "frist", label: "Frist" },
  { value: "notiz", label: "Notiz" },
] as const
export type AktivitaetTyp = (typeof AKTIVITAET_TYPEN)[number]["value"]

export const FELDTYPEN = [
  { value: "text", label: "Text" },
  { value: "zahl", label: "Zahl" },
  { value: "betrag", label: "Betrag" },
  { value: "datum", label: "Datum" },
  { value: "einzeloption", label: "Einzelauswahl" },
  { value: "mehrfachoption", label: "Mehrfachauswahl" },
  { value: "adresse", label: "Adresse" },
  { value: "boolean", label: "Ja/Nein" },
] as const
export type Feldtyp = (typeof FELDTYPEN)[number]["value"]

export const CUSTOM_FIELD_ENTITAETEN = ["deal", "lead"] as const
export type CustomFieldEntitaet = (typeof CUSTOM_FIELD_ENTITAETEN)[number]

export function markeLabel(value: string): string {
  return MARKEN.find((m) => m.value === value)?.label ?? value
}

export function quelleLabel(value: string): string {
  return LEAD_QUELLEN.find((q) => q.value === value)?.label ?? value
}

export function aktivitaetLabel(value: string): string {
  return AKTIVITAET_TYPEN.find((a) => a.value === value)?.label ?? value
}
