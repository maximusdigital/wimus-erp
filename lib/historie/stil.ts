/**
 * Aktivitäts-Stil (Typ/Modul → Icon-Key + Farbe) und Zeit-Gruppierung.
 * REINE Logik, UI-unabhängig (testbar). Farben = Design-Tokens (kein Hardcode).
 */
import type { Aktivitaet } from "./types"

export type StilFarbe = "success" | "danger" | "warning" | "secondary" | "teal" | "muted"

/** Modul → Default-Farbe (Spec 000 §UI: Finanzen grün, Kommunikation blau …). */
const MODUL_FARBE: Record<string, StilFarbe> = {
  fibu: "success",
  finanzen: "success",
  kommunikation: "secondary",
  belegung: "teal",
  vertrag: "muted",
  zugang: "muted",
  vorgang: "warning",
}

/** Typ-spezifische Überschreibungen (gewinnen über Modul-Farbe). */
const TYP_FARBE: Record<string, StilFarbe> = {
  mahnung_versandt: "danger",
  schaden_gemeldet: "danger",
  zahlung_eingegangen: "success",
  vertrag_beendet: "warning",
  zugang_entzogen: "danger",
}

/** Icon-Key (lucide-Name wird in der UI gemappt). */
const TYP_ICON: Record<string, string> = {
  zahlung_eingegangen: "banknote",
  mahnung_versandt: "alert-triangle",
  nachricht_gesendet: "send",
  nachricht_empfangen: "inbox",
  vertrag_angelegt: "file-text",
  vertrag_beendet: "file-x",
  schaden_gemeldet: "alert-octagon",
  zugang_vergeben: "key-round",
  zugang_entzogen: "key-round",
  sperre_gesetzt: "calendar-off",
  buchung_angelegt: "calendar-check",
  beleg_verbucht: "receipt",
  automation_ausgeloest: "zap",
}

export function aktivitaetFarbe(a: Pick<Aktivitaet, "typ" | "modul">): StilFarbe {
  return TYP_FARBE[a.typ] ?? MODUL_FARBE[a.modul] ?? "muted"
}

export function aktivitaetIcon(a: Pick<Aktivitaet, "typ" | "modul">): string {
  return TYP_ICON[a.typ] ?? "circle-dot"
}

// --- Zeit-Gruppierung (Heute / Gestern / Letzte Woche / Datum) ---------------

export type ZeitGruppe = "heute" | "gestern" | "letzte_woche" | "aelter"

export const ZEIT_GRUPPE_LABEL: Record<ZeitGruppe, string> = {
  heute: "Heute",
  gestern: "Gestern",
  letzte_woche: "Letzte Woche",
  aelter: "Älter",
}

/** Ordnet einen Zeitpunkt relativ zu `jetzt` einer Gruppe zu (lokale Tagesgrenzen). */
export function zeitGruppe(zeitpunkt: string | Date, jetzt: Date): ZeitGruppe {
  const z = typeof zeitpunkt === "string" ? new Date(zeitpunkt) : zeitpunkt
  const tag = (d: Date) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)
  const diff = tag(jetzt) - tag(z)
  if (diff <= 0) return "heute"
  if (diff === 1) return "gestern"
  if (diff <= 7) return "letzte_woche"
  return "aelter"
}

/** Gruppiert (bereits nach zeitpunkt DESC sortierte) Aktivitäten in Zeitgruppen. */
export function gruppiereFeed<T extends { zeitpunkt: string }>(
  items: T[],
  jetzt: Date,
): { gruppe: ZeitGruppe; label: string; items: T[] }[] {
  const order: ZeitGruppe[] = ["heute", "gestern", "letzte_woche", "aelter"]
  const buckets = new Map<ZeitGruppe, T[]>()
  for (const it of items) {
    const g = zeitGruppe(it.zeitpunkt, jetzt)
    const arr = buckets.get(g) ?? []
    arr.push(it)
    buckets.set(g, arr)
  }
  return order
    .filter((g) => buckets.has(g))
    .map((g) => ({ gruppe: g, label: ZEIT_GRUPPE_LABEL[g], items: buckets.get(g)! }))
}
