/**
 * Eskalations-Logik (Spec 0004). Rein/testbar (DB-frei).
 * Eskalation fällig, wenn ein offener Vorgang Notfall-Priorität hat ODER überfällig ist
 * (faellig_am in der Vergangenheit). Abgeschlossene Vorgänge eskalieren nie.
 */
import { istAbgeschlossen } from "@/lib/ops/status"

export function istUeberfaellig(
  faellig_am: string | null | undefined,
  status: string,
  jetzt: Date | string = new Date()
): boolean {
  if (!faellig_am || istAbgeschlossen(status)) return false
  return new Date(faellig_am).getTime() < new Date(jetzt).getTime()
}

export type EskalationsGrund = "notfall" | "ueberfaellig" | null

/** Grund, warum (computed) eskaliert werden sollte — null = kein Anlass. */
export function eskalationsGrund(
  vorgang: { prioritaet: string; status: string; faellig_am?: string | null },
  jetzt: Date | string = new Date()
): EskalationsGrund {
  if (istAbgeschlossen(vorgang.status)) return null
  if (vorgang.prioritaet === "notfall") return "notfall"
  if (istUeberfaellig(vorgang.faellig_am, vorgang.status, jetzt)) return "ueberfaellig"
  return null
}

/** Soll der Vorgang (rechnerisch) eskaliert sein? */
export function eskalationFaellig(
  vorgang: { prioritaet: string; status: string; faellig_am?: string | null },
  jetzt: Date | string = new Date()
): boolean {
  return eskalationsGrund(vorgang, jetzt) !== null
}

/** Anzeige: eskaliert (manuell gesetzt ODER rechnerisch fällig)? */
export function zeigtEskalation(
  vorgang: { prioritaet: string; status: string; faellig_am?: string | null; eskaliert?: boolean },
  jetzt: Date | string = new Date()
): boolean {
  return vorgang.eskaliert === true || eskalationFaellig(vorgang, jetzt)
}
