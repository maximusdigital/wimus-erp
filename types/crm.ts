import type {
  AktivitaetTyp,
  CustomFieldEntitaet,
  DealStatus,
  Feldtyp,
  LeadQuelle,
  LeadStatus,
  Marke,
} from "@/lib/crm/constants"

export type {
  AktivitaetTyp,
  CustomFieldEntitaet,
  DealStatus,
  Feldtyp,
  LeadQuelle,
  LeadStatus,
  Marke,
}

export type Pipeline = {
  id: string
  mandant_id: string
  name: string
  beschreibung: string | null
  marke: Marke
  aktiv: boolean
  sortierung: number
  default_pipeline: boolean
  created_at: string
  updated_at: string
}

export type PipelineStage = {
  id: string
  mandant_id: string
  pipeline_id: string
  name: string
  sortierung: number
  wahrscheinlichkeit: number
  ist_gewonnen: boolean
  ist_verloren: boolean
  stalled_tage: number | null
  farbe: string | null
  created_at: string
  updated_at: string
}

export type VerlorenGrund = {
  id: string
  mandant_id: string
  bezeichnung: string
  sortierung: number
  aktiv: boolean
}

export type CustomFieldDefinition = {
  id: string
  mandant_id: string
  entitaet: CustomFieldEntitaet
  name: string
  feldtyp: Feldtyp
  optionen: string[]
  anzeige_hinzufuegen: boolean
  anzeige_detail: boolean
  pflicht: boolean
  wichtig: boolean
  pipeline_id: string | null
  sortierung: number
  aktiv: boolean
}

export type KontaktRef = { id: string; vorname: string | null; nachname: string | null }
export type OrganisationRef = { id: string; name: string }
export type FirmaRef = { id: string; name: string; kuerzel: string | null }

export type Deal = {
  id: string
  mandant_id: string
  firma_id: string
  pipeline_id: string
  stage_id: string
  titel: string
  kontakt_id: string | null
  organisation_id: string | null
  objekt_id: string | null
  einheit_immobilie_id: string | null
  wert: number | null
  waehrung: string
  erwartetes_abschluss_datum: string | null
  status: DealStatus
  verloren_grund_id: string | null
  owner_akteur_id: string | null
  custom_values: Record<string, unknown>
  in_stage_seit: string
  abgeschlossen_am: string | null
  created_at: string
  updated_at: string
}

export type DealMitBezug = Deal & {
  kontakt?: KontaktRef | null
  organisation?: OrganisationRef | null
  firma?: FirmaRef | null
  stage?: Pick<PipelineStage, "id" | "name" | "ist_gewonnen" | "ist_verloren" | "stalled_tage"> | null
}

export type DealStageHistorie = {
  id: string
  deal_id: string
  von_stage_id: string | null
  nach_stage_id: string
  akteur_id: string | null
  am: string
  verweildauer_tage: number | null
}

export type DealAktivitaet = {
  id: string
  mandant_id: string
  deal_id: string
  typ: AktivitaetTyp
  titel: string
  beschreibung: string | null
  faellig_am: string | null
  erledigt: boolean
  erledigt_am: string | null
  akteur_id: string | null
  sip_referenz: string | null
  nachricht_id: string | null
  created_at: string
}

export type Lead = {
  id: string
  mandant_id: string
  firma_id: string | null
  quelle: LeadQuelle
  kontakt_id: string | null
  organisation_id: string | null
  name: string
  kontaktdaten: string | null
  anfrage_text: string | null
  objekt_bezug_id: string | null
  status: LeadStatus
  verworfen_grund: string | null
  labels: string[]
  custom_values: Record<string, unknown>
  zugeordnet_akteur_id: string | null
  deal_id: string | null
  created_at: string
  updated_at: string
}
