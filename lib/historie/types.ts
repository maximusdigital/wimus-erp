/**
 * Modul 009 (historie) – gemeinsame Typen. Zwei Ebenen:
 * Audit-Log (technisch, DB-Trigger) + Aktivitäts-Historie (fachlich, protokolliere).
 */

export type BezugTyp =
  | "kontakt" | "mieter" | "einheit" | "objekt"
  | "vorgang" | "organisation" | "mietvertrag" | "buchung"

export type BezugQuelle = "primaer" | "abgeleitet"

export type EntityRef = { typ: BezugTyp; id: string }

export type Bezug = EntityRef & { quelle: BezugQuelle }

/** Fachliche Aktivität (kuratiert, von Modulen über protokolliere() geliefert). */
export type Aktivitaet = {
  id: string
  mandant_id: string
  typ: string
  modul: string
  titel: string
  beschreibung: string | null
  akteur_id: string | null
  audit_log_id: number | null
  payload: Record<string, unknown> | null
  zeitpunkt: string // ISO
}

/** Ein Eintrag des Audit-Logs (roh, technisch). */
export type AuditEntry = {
  id: number
  mandant_id: string | null
  tabelle: string
  operation: "INSERT" | "UPDATE" | "DELETE"
  datensatz_id: string | null
  alt: Record<string, unknown> | null
  neu: Record<string, unknown> | null
  geaendert_felder: string[] | null
  akteur_id: string | null
  akteur_quelle: "app" | "system" | "direkt"
  zeitpunkt: string
}

/** Aufgelöste Hierarchie-IDs zu einem Primär-Bezug (für die abgeleiteten Bezüge). */
export type Hierarchie = {
  kontakt_id?: string | null
  mieter_id?: string | null
  mietvertrag_id?: string | null
  einheit_id?: string | null
  objekt_id?: string | null
  vorgang_id?: string | null
  organisation_id?: string | null
  buchung_id?: string | null
}

export type ProtokolliereInput = {
  typ: string
  modul: string
  titel: string
  beschreibung?: string | null
  payload?: Record<string, unknown> | null
  akteurId?: string | null
  primaerBezug: EntityRef
}
