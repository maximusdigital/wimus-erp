/**
 * Kommunikations-Schicht (Modul 007) — Autoreply Stufe 1 (statisch, rein/testbar).
 *
 * Deterministisch, KEINE KI. Trigger = eingehende Nachricht; Bedingung = immer /
 * außerhalb Geschäftszeiten / Stichwort; Aktion = fester Antworttext. Anti-
 * Schleife: nie auf Autoreply, nicht mehrfach je Kontakt/Konversation im Fenster.
 *
 * Upgrade-Pfad (Modul 0005): Die Regel-Auswertung wandert in die Automatik-Engine,
 * die Aktion „antwort_text senden" wird zu „Engine/Agent rufen" — die Tabelle
 * `kom_autoreply_regeln` bleibt Regel-Quelle (kein zweites Regel-Modell).
 */

import { KOM_CONFIG, type GeschaeftszeitenFenster } from "./config"

export type AutoreplyRegel = {
  id: string
  aktiv: boolean
  bedingung_typ: "immer" | "ausser_geschaeftszeiten" | "stichwort"
  /** Stichwort-Liste oder Zeitfenster (für ausser_geschaeftszeiten). */
  bedingung_wert?: {
    stichworte?: string[]
    geschaeftszeiten?: GeschaeftszeitenFenster
  } | null
  antwort_text: string
}

export type AutoreplyTrigger = {
  /** Eingehender Nachrichtentext (für Stichwort-Match). */
  text: string | null
  /** Eingangszeitpunkt (für Geschäftszeiten-Prüfung). */
  zeitpunkt: Date
  /** War die eingehende Nachricht selbst ein Autoreply? → nie antworten. */
  istAutoreply: boolean
  /** Zeitpunkt des letzten Autoreplys an diesen Kontakt/Konversation (Anti-Schleife). */
  letzterAutoreplyAm?: Date | null
}

export type AutoreplyEntscheidung =
  | { antworten: false; grund: string }
  | { antworten: true; regelId: string; antwortText: string }

function innerhalbGeschaeftszeiten(d: Date, fenster: GeschaeftszeitenFenster): boolean {
  const tag = d.getDay()
  if (!fenster.wochentage.includes(tag)) return false
  const stunde = d.getHours()
  return stunde >= fenster.vonStunde && stunde < fenster.bisStunde
}

function stichwortTrifft(text: string | null, stichworte: string[] | undefined): boolean {
  if (!text || !stichworte || stichworte.length === 0) return false
  const hay = text.toLowerCase()
  return stichworte.some((s) => s.trim() !== "" && hay.includes(s.toLowerCase()))
}

function regelGreift(regel: AutoreplyRegel, t: AutoreplyTrigger): boolean {
  switch (regel.bedingung_typ) {
    case "immer":
      return true
    case "ausser_geschaeftszeiten": {
      const fenster = regel.bedingung_wert?.geschaeftszeiten ?? KOM_CONFIG.geschaeftszeiten
      return !innerhalbGeschaeftszeiten(t.zeitpunkt, fenster)
    }
    case "stichwort":
      return stichwortTrifft(t.text, regel.bedingung_wert?.stichworte)
    default:
      return false
  }
}

/**
 * Entscheidet, ob (und mit welchem Text) automatisch geantwortet wird.
 * Erste greifende aktive Regel gewinnt. Anti-Schleife geht vor allen Regeln.
 */
export function entscheideAutoreply(
  regeln: AutoreplyRegel[],
  trigger: AutoreplyTrigger,
): AutoreplyEntscheidung {
  if (trigger.istAutoreply) return { antworten: false, grund: "eingehende Nachricht ist selbst Autoreply" }

  if (trigger.letzterAutoreplyAm) {
    const diffMin = (trigger.zeitpunkt.getTime() - trigger.letzterAutoreplyAm.getTime()) / 60000
    if (diffMin >= 0 && diffMin < KOM_CONFIG.autoreplyFensterMinuten) {
      return { antworten: false, grund: `Anti-Schleife: Autoreply vor ${Math.round(diffMin)} min` }
    }
  }

  for (const regel of regeln) {
    if (!regel.aktiv) continue
    if (regelGreift(regel, trigger)) {
      return { antworten: true, regelId: regel.id, antwortText: regel.antwort_text }
    }
  }
  return { antworten: false, grund: "keine Regel greift" }
}
