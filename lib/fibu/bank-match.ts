/**
 * Bank-Abgleich Match-Engine (Spec 0002). Mehrstufig, rein/testbar — Kandidaten
 * (Objekte/Einheiten/Mieter) werden injiziert.
 *
 *   0. Vorfilter: eigene Umbuchungen (Geldtransit/GT KSK/KSKLB) → ignoriert.
 *   1. K1-Match: Verwendungszweck/Empfänger gegen Einheiten-Code (verwendungszweck_code)
 *      bzw. Objekt-Kürzel (objekte.kuerzel). K1 kann Suffix tragen (ThS97Z1).
 *   2. Name-Match: Empfänger gegen Mieter-Namen über die zentrale Fuzzy-Engine
 *      (`fuzzy.ts`, Personen-Varianten „Nachname, Vorname" ↔ „Vorname Nachname").
 *   3. Betrag-Bestätiger: Betrag ≈ offene Miete-Forderung → erhöht Confidence.
 *   4. Confidence-Routing: auto / pruefen / klaeren (Schwellen konfigurierbar).
 *
 * Ausgaben (Minus) bekommen höchstens einen K1-Objektbezug, NIE einen Mieter-/
 * OP-Abgleich (Auftrag: Kostenbezug, Beleg-Verknüpfung später).
 */
import { normBase, personRatio } from "./fuzzy"
import { parseVerwendungszweck } from "@/lib/utils/verwendungszweck"
import type { BankZeile } from "./bank-csv"

export type MatchKontext = {
  einheiten: { id: string; objekt_id: string; code: string }[] // verwendungszweck_code
  objekte: { id: string; kuerzel: string }[]
  mieter: {
    mietvertrag_id: string
    objekt_id: string | null
    einheit_id: string | null
    name: string
    offene_miete?: number | null
  }[]
  ignorierMuster?: string[] // Teilstrings (lowercase), Default unten
  kontoinhaber?: string[] // eigene Namen → ignoriert
  schwellen?: { nameMin?: number; auto?: number; pruefen?: number }
}

export type UmsatzMatch = {
  ignoriert: boolean
  erkanntes_k1: string | null
  objekt_id: string | null
  einheit_id: string | null
  mietvertrag_id: string | null
  match_methode: "k1" | "name" | "betrag" | null
  match_confidence: number | null
  routing: "auto" | "pruefen" | "klaeren" | "ignoriert"
}

const DEFAULT_IGNORE = ["geldtransit", "gt ksk", "ksklb-ksklb", "ksklb ksklb", "umbuchung"]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function matchUmsatz(z: BankZeile, ctx: MatchKontext): UmsatzMatch {
  const leer: UmsatzMatch = {
    ignoriert: false,
    erkanntes_k1: null,
    objekt_id: null,
    einheit_id: null,
    mietvertrag_id: null,
    match_methode: null,
    match_confidence: null,
    routing: "klaeren",
  }

  // 0. Vorfilter (eigene Umbuchungen / Kontoinhaber)
  const hay = `${z.verwendungszweck} ${z.empfaenger}`.toLowerCase()
  const ignore = (ctx.ignorierMuster ?? DEFAULT_IGNORE).map((s) => s.toLowerCase())
  const inhaber = (ctx.kontoinhaber ?? []).map(normBase)
  if (ignore.some((p) => hay.includes(p)) || (z.empfaenger && inhaber.includes(normBase(z.empfaenger)))) {
    return { ...leer, ignoriert: true, routing: "ignoriert" }
  }

  // 1. K1-Match (Tokens gegen Einheiten-Code, dann Objekt-Kürzel)
  const tokens = `${z.verwendungszweck} ${z.empfaenger}`.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)
  const codeMap = new Map(ctx.einheiten.map((e) => [e.code.toUpperCase(), e]))
  const kuerzelMap = new Map(ctx.objekte.map((o) => [o.kuerzel.toUpperCase(), o]))
  let objekt_id: string | null = null
  let einheit_id: string | null = null
  let k1: string | null = null
  for (const tk of tokens) {
    // a) Volle Einheit-Code-Übereinstimmung (verwendungszweck_code, z. B. BHS16W3Z1).
    const e = codeMap.get(tk)
    if (e) {
      einheit_id = e.id
      objekt_id = e.objekt_id
      k1 = tk
      break
    }
    // b) Vorhandenen Parser nutzen: Objektkürzel (+ optional W/Z) aus dem Token ziehen
    //    und gegen objekte.kuerzel auflösen (Treffer auch ohne Einheit-Zeile).
    const p = parseVerwendungszweck(tk)
    if (p) {
      const o = kuerzelMap.get(p.objektKuerzel.toUpperCase())
      if (o) {
        objekt_id = o.id
        k1 = tk
        break
      }
    }
  }

  // 2. Name-Match (Fuzzy) über alle Mieter
  const nameMin = ctx.schwellen?.nameMin ?? 0.82
  let mietvertrag_id: string | null = null
  let nameScore = 0
  let cand: MatchKontext["mieter"][number] | null = null
  if (z.empfaenger) {
    for (const m of ctx.mieter) {
      const s = personRatio(z.empfaenger, m.name)
      if (s > nameScore) {
        nameScore = s
        cand = m
      }
    }
    if (cand && nameScore >= nameMin) {
      mietvertrag_id = cand.mietvertrag_id
      // Objekt/Einheit aus dem Mieter ableiten, falls K1 nichts ergab.
      if (!objekt_id) objekt_id = cand.objekt_id
      if (!einheit_id) einheit_id = cand.einheit_id
    }
  }

  // 3. Betrag-Bestätiger (offene Miete des Kandidaten ≈ Einnahme)
  let betragOk = false
  if (mietvertrag_id && cand?.offene_miete != null && z.richtung === "einnahme") {
    if (Math.abs(Math.abs(z.betrag) - cand.offene_miete) <= 1.0) betragOk = true
  }

  // 4. Methode + Confidence
  let methode: UmsatzMatch["match_methode"] = null
  let confidence = 0
  if (k1 && mietvertrag_id) {
    methode = "k1"
    confidence = betragOk ? 0.97 : 0.9
  } else if (k1) {
    methode = "k1"
    confidence = einheit_id ? 0.85 : 0.78
  } else if (mietvertrag_id) {
    methode = "name"
    confidence = betragOk ? 0.9 : Math.min(0.85, nameScore)
  }

  // Ausgaben: kein Mieter-/OP-Abgleich, nur K1-Objektbezug.
  if (z.richtung === "ausgabe") {
    mietvertrag_id = null
    if (methode === "name") {
      methode = null
      confidence = 0
    }
  }

  const autoT = ctx.schwellen?.auto ?? 0.9
  const pruefT = ctx.schwellen?.pruefen ?? 0.75
  let routing: UmsatzMatch["routing"] = "klaeren"
  if (methode) {
    if (confidence >= autoT) routing = "auto"
    else if (confidence >= pruefT) routing = "pruefen"
  }
  // Ausgaben nie auto (kein OP-Abgleich, nur Vorschlag).
  if (z.richtung === "ausgabe" && routing === "auto") routing = "pruefen"

  return {
    ignoriert: false,
    erkanntes_k1: k1,
    objekt_id,
    einheit_id,
    mietvertrag_id,
    match_methode: methode,
    match_confidence: methode ? round2(confidence) : null,
    routing,
  }
}
