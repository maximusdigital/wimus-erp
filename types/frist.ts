/** Frist – Datentyp + Auswahl-Konstanten (Spec 0001, wimus.fristen). */

export type Frist = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  frist_typ: string
  bezug_typ: string | null
  bezug_id: string | null
  bezeichnung: string | null
  start_datum: string | null
  faellig_am: string
  erinnerung_tage_vorher: number[] | null
  eskalation_akteur_id: string | null
  aktion_typ: string | null
  status: string
  erledigt_am: string | null
  vorgang_id: string | null
  automatisch_erstellt: boolean | null
}

/** Fristtypen (Spec 30_prozesse Kap. 2). */
export const FRIST_TYPEN = [
  "bk_anpassung",
  "mieterhoehung",
  "modernisierung",
  "kuendigung",
  "raeumung",
  "kautionsabrechnung",
  "gewaehrleistung",
  "wartung_rauchmelder",
  "wartung_aufzug",
  "wartung_legionellen",
  "staffelmiete",
  "indexmiete",
  "verjaehrung",
] as const

export const FRIST_TYP_LABELS: Record<string, string> = {
  bk_anpassung: "BK-Anpassung (§560)",
  mieterhoehung: "Mieterhöhung",
  modernisierung: "Modernisierung (§555b)",
  kuendigung: "Kündigung",
  raeumung: "Räumung (§546a)",
  kautionsabrechnung: "Kautionsabrechnung (§259)",
  gewaehrleistung: "Gewährleistung (§634a)",
  wartung_rauchmelder: "Wartung Rauchmelder",
  wartung_aufzug: "Wartung Aufzug (TÜV)",
  wartung_legionellen: "Wartung Legionellen",
  staffelmiete: "Staffelmiete",
  indexmiete: "Indexmiete (VPI)",
  verjaehrung: "Verjährung (§195)",
}

export const FRIST_STATUS = ["offen", "erinnert", "eskaliert", "erledigt"] as const

export const FRIST_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  erinnert: "Erinnert",
  eskaliert: "Eskaliert",
  erledigt: "Erledigt",
}
