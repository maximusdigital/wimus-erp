/**
 * Modul 008 (felder) – gemeinsame Typen der Custom-Field-Schicht + Kontaktmodell.
 *
 * Speicher-Variante C (typisierte EAV-Wert-Spalten) ist hinter dieser Service-
 * Schicht gekapselt: Konsumenten (UI, 0006-Filter) sprechen NUR diese Typen/
 * Funktionen, nie direkt die Wert-Tabellen. Ein späterer Wechsel C↔B bliebe lokal.
 */

/** Feldtypen Stufe 1 (Spec 008 §72). Stabil — entscheidet die Speicher-Spalte. */
export const FELDTYPEN = [
  { value: "text", label: "Text" },
  { value: "zahl", label: "Zahl" },
  { value: "datum", label: "Datum" },
  { value: "auswahl", label: "Auswahl (eine Option)" },
  { value: "mehrfachauswahl", label: "Mehrfachauswahl" },
  { value: "janein", label: "Ja/Nein" },
] as const

export type FieldType = (typeof FELDTYPEN)[number]["value"]

/** Entitäten, die in Stufe 1 Custom Fields tragen (erweiterbar). */
export const FELD_ENTITAETEN = [
  { value: "person", label: "Person" },
  { value: "organisation", label: "Organisation" },
  { value: "vorgang", label: "Vorgang" },
  { value: "objekt", label: "Objekt" },
  { value: "einheit", label: "Einheit" },
] as const

export type FeldEntitaet = (typeof FELD_ENTITAETEN)[number]["value"]

export type EntityRef = { entitaet: string; id: string }

export type FieldOption = {
  id: string
  opt_key: string
  label: string
  sortierung: number
  aktiv: boolean
}

export type FieldDef = {
  id: string
  mandant_id: string
  entitaet: string // = bezug_typ in der DB
  key: string // = feldschluessel (stabil)
  label: string // = feldname (umbenennbar)
  typ: FieldType
  geschuetzt: boolean
  pflicht: boolean
  sortierung: number | null
  gruppe: string | null
  aktiv: boolean
  optionen?: FieldOption[]
}

/** Normalisierter Wert eines Custom Fields an einer Entitäts-Zeile. */
export type FieldValue = {
  def_id: string
  typ: FieldType
  text?: string | null
  zahl?: number | null
  datum?: string | null // ISO-Date
  bool?: boolean | null
  optionen?: string[] // opt_key[] (mehrfachauswahl)
}

/** Kontakt-/Organisationstyp (n:m). */
export type KontaktTyp = {
  id: string
  mandant_id: string
  gilt_fuer: "person" | "organisation"
  typ_key: string
  label: string
  geschuetzt: boolean
  beschreibung: string | null
  sortierung: number
  aktiv: boolean
}
