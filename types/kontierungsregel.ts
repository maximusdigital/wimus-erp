/** Kontierungsregel (Spec 0002, wimus.kontierungsregeln). Speist lib/utils/fibu.kontiere(). */

export type Kontierungsregel = {
  id: string
  created_at: string
  updated_at: string
  mandant_id: string
  scope: string
  firma_id: string | null
  match: string
  soll_konto: string
  haben_logik: string | null
  ust_satz: number | null
  steuerschluessel: string | null
  prioritaet: number
  aktiv: boolean
}

export type KontierungsregelMitFirma = Kontierungsregel & {
  firma?: { id: string; name: string; kuerzel: string | null } | null
}

export const KONTIERUNG_SCOPES = ["workspace", "einheit"] as const

export const KONTIERUNG_SCOPE_LABELS: Record<string, string> = {
  workspace: "Workspace (Default)",
  einheit: "Firma (Override)",
}
