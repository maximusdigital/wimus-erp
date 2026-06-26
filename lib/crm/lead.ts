/**
 * Lead-Triage & Konvertierung (Spec 0003, 30_prozesse §1–2 + 60_tests).
 * Reine Funktionen, DB-frei.
 */
import type { Lead } from "@/types/crm"

/** Konvertierbar = Status neu oder qualifiziert (nicht erneut bei konvertiert/verworfen). */
export function istKonvertierbar(lead: Pick<Lead, "status" | "deal_id">): boolean {
  return (
    (lead.status === "neu" || lead.status === "qualifiziert") && lead.deal_id == null
  )
}

export type KonvertierInput = {
  firma_id: string
  pipeline_id: string
  stage_id: string
  titel: string
  kontakt_id?: string | null
  organisation_id?: string | null
  objekt_id?: string | null
  wert?: number | null
  owner_akteur_id?: string | null
}

export type KonvertierErgebnis = {
  /** Insert-Payload für crm_deals. */
  deal: {
    firma_id: string
    pipeline_id: string
    stage_id: string
    titel: string
    kontakt_id: string | null
    organisation_id: string | null
    objekt_id: string | null
    wert: number | null
    owner_akteur_id: string | null
    status: "offen"
    custom_values: Record<string, unknown>
  }
  /** Patch für crm_leads nach erfolgreicher Deal-Anlage. */
  leadPatch: { status: "konvertiert"; deal_id: string }
}

/**
 * Bereitet die Lead→Deal-Konvertierung vor. `firma_id` (Mandant/Einheit, INNEN)
 * ist Pflicht. Wirft, wenn der Lead nicht (mehr) konvertierbar ist.
 * `dealId` wird nach dem Insert des Deals gesetzt (für den Lead-Patch).
 */
export function konvertiereLead(
  lead: Pick<Lead, "status" | "deal_id" | "kontakt_id" | "organisation_id" | "custom_values">,
  input: KonvertierInput,
  dealId: string
): KonvertierErgebnis {
  if (!istKonvertierbar(lead)) {
    throw new Error("Lead ist bereits konvertiert oder verworfen.")
  }
  if (!input.firma_id) {
    throw new Error("firma_id (Mandant/Einheit) ist Pflicht bei der Konvertierung.")
  }
  return {
    deal: {
      firma_id: input.firma_id,
      pipeline_id: input.pipeline_id,
      stage_id: input.stage_id,
      titel: input.titel,
      kontakt_id: input.kontakt_id ?? lead.kontakt_id ?? null,
      organisation_id: input.organisation_id ?? lead.organisation_id ?? null,
      objekt_id: input.objekt_id ?? null,
      wert: input.wert ?? null,
      owner_akteur_id: input.owner_akteur_id ?? null,
      status: "offen",
      custom_values: lead.custom_values ?? {},
    },
    leadPatch: { status: "konvertiert", deal_id: dealId },
  }
}

export type VerwerfenErgebnis = { status: "verworfen"; verworfen_grund: string }

/** Lead verwerfen (+ Grund Pflicht). Bleibt für Auswertung erhalten. */
export function verwerfeLead(grund: string): VerwerfenErgebnis {
  const g = grund?.trim()
  if (!g) throw new Error("Verwerfen erfordert einen Grund.")
  return { status: "verworfen", verworfen_grund: g }
}
