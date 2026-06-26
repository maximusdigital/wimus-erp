/**
 * Stage-Logik (Spec 0003, 30_prozesse §3 + 60_tests).
 * Reine Funktionen, DB-frei → vitest-testbar.
 */
import type { DealStatus } from "@/lib/crm/constants"

const MS_PRO_TAG = 1000 * 60 * 60 * 24

/** Ganze Tage zwischen zwei Zeitpunkten (abgerundet, nie negativ). */
export function tageZwischen(von: Date | string, bis: Date | string): number {
  const a = new Date(von).getTime()
  const b = new Date(bis).getTime()
  return Math.max(0, Math.floor((b - a) / MS_PRO_TAG))
}

/** Tage, die ein Deal in der aktuellen Stage liegt. */
export function tageInStage(inStageSeit: Date | string, jetzt: Date | string): number {
  return tageZwischen(inStageSeit, jetzt)
}

/** Stalled = Verweildauer erreicht/überschreitet die Stage-Schwelle. */
export function istStalled(tageInStage: number, stalledTage: number | null): boolean {
  if (stalledTage == null) return false
  return tageInStage >= stalledTage
}

/** Abgeschlossen = gewonnen oder verloren (kein Stage-Drag mehr). */
export function istAbgeschlossen(status: DealStatus): boolean {
  return status === "gewonnen" || status === "verloren"
}

export type StageUebergang = {
  /** Historien-Eintrag für crm_deal_stage_historie. */
  historie: {
    von_stage_id: string | null
    nach_stage_id: string
    verweildauer_tage: number
    am: string
  }
  /** Patch für crm_deals (neue Stage + zurückgesetzter Stage-Timer). */
  patch: {
    stage_id: string
    in_stage_seit: string
  }
}

/**
 * Berechnet den Stage-Wechsel eines Deals.
 * Wirft, wenn der Deal abgeschlossen ist (gewonnen/verloren) – dann ist Drag
 * gesperrt (Spec: reaktivieren nur explizit mit Audit).
 */
export function stageUebergang(
  deal: { stage_id: string; in_stage_seit: string | Date; status: DealStatus },
  nachStageId: string,
  jetzt: Date | string = new Date()
): StageUebergang {
  if (istAbgeschlossen(deal.status)) {
    throw new Error("Abgeschlossener Deal: Stage kann nicht per Drag geändert werden.")
  }
  const amISO = new Date(jetzt).toISOString()
  return {
    historie: {
      von_stage_id: deal.stage_id,
      nach_stage_id: nachStageId,
      verweildauer_tage: tageZwischen(deal.in_stage_seit, jetzt),
      am: amISO,
    },
    patch: {
      stage_id: nachStageId,
      in_stage_seit: amISO,
    },
  }
}
