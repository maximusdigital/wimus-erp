/**
 * Audit-Log lesen (Compliance-Ansicht). Server-only. RLS isoliert den Mandanten;
 * die Rollen-Beschränkung (nur Verwalter/Admin) erfolgt app-seitig (s. /einstellungen/audit).
 * audit_log ist append-only — hier ausschließlich SELECT.
 */
import type { AuditEntry } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

export type AuditFilter = {
  tabelle?: string
  datensatzId?: string
  akteurId?: string
  limit?: number
  before?: string // ISO
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAudit(r: any): AuditEntry {
  return {
    id: r.id,
    mandant_id: r.mandant_id ?? null,
    tabelle: r.tabelle,
    operation: r.operation,
    datensatz_id: r.datensatz_id ?? null,
    alt: r.alt ?? null,
    neu: r.neu ?? null,
    geaendert_felder: r.geaendert_felder ?? null,
    akteur_id: r.akteur_id ?? null,
    akteur_quelle: r.akteur_quelle,
    zeitpunkt: r.zeitpunkt,
  }
}

export async function getAudit(client: DbClient, filter: AuditFilter = {}): Promise<AuditEntry[]> {
  let q = client
    .from("audit_log")
    .select("*")
    .order("zeitpunkt", { ascending: false })
    .limit(filter.limit ?? 100)
  if (filter.tabelle) q = q.eq("tabelle", filter.tabelle)
  if (filter.datensatzId) q = q.eq("datensatz_id", filter.datensatzId)
  if (filter.akteurId) q = q.eq("akteur_id", filter.akteurId)
  if (filter.before) q = q.lt("zeitpunkt", filter.before)
  const { data } = await q
  return (data ?? []).map(mapAudit)
}

/** Audit-Historie einer konkreten Zeile (für „Datensatz-Verlauf"). */
export async function getAuditFor(client: DbClient, tabelle: string, datensatzId: string): Promise<AuditEntry[]> {
  return getAudit(client, { tabelle, datensatzId, limit: 200 })
}
