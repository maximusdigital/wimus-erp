/**
 * Belegerkennungs-Pipeline (Spec 0002, 30_prozesse): Eingang → (E-Rechnung-Weiche
 * | OCR+KI-Extraktion) → deterministische Validierung → Kontierung → Gating →
 * Buchungsentwurf. KI extrahiert nur Fakten; Kontierung & Validierung sind
 * deterministisch (kein Prompt-Drift).
 *
 * Abhängigkeiten (OCR/Extraktion) werden injiziert → ohne Netz testbar; die
 * E-Rechnungs-Weiche läuft komplett ohne KI (confidence 1.0).
 */
import {
  parseErechnung,
  istErechnung,
  type ErechnungDaten,
} from "@/lib/utils/erechnung"
import { pruefeBeleg } from "@/lib/utils/fibu-beleg"
import { gating } from "@/lib/utils/fibu-beleg"
import { kontiere, type Kontierungsregel } from "@/lib/utils/fibu"
import type { BelegExtraktion } from "@/lib/integrations/mistral"

export type PipelineInput = {
  /** Textinhalt (z. B. ZUGFeRD/XRechnung-XML) – falls vorhanden, vor OCR geprüft. */
  content?: string | null
  /** Data-URL für OCR, falls kein strukturierter Inhalt. */
  dataUrl?: string | null
}

export type PipelineKontext = {
  heute: string
  regeln: Kontierungsregel[]
  gating?: { minConfidence?: number; maxBetrag?: number }
}

export type PipelineDeps = {
  ocr: (dataUrl: string) => Promise<string>
  extrahiere: (text: string) => Promise<BelegExtraktion>
}

export type BelegEntwurf = {
  quelle: "erechnung" | "ocr"
  belegnummer: string | null
  belegdatum: string | null
  netto: number | null
  ust_betrag: number | null
  ust_satz: number | null
  brutto: number | null
  lieferant_name: string | null
  lieferant_ustid: string | null
  iban: string | null
  gewerk: string | null
  k1: string | null
  soll_konto: string | null
  steuerschluessel: string | null
  confidence_ocr: number
  confidence_extraktion: number
  confidence_kontierung: number
  review_flag: boolean
  review_gruende: string[]
  auto_buchbar: boolean
  status: "freigabe_offen" | "gebucht"
}

function ausErechnung(d: ErechnungDaten): Partial<BelegEntwurf> {
  return {
    quelle: "erechnung",
    belegnummer: d.belegnummer,
    belegdatum: d.belegdatum,
    netto: d.netto,
    ust_betrag: d.ust_betrag,
    ust_satz:
      d.netto && d.ust_betrag ? Math.round((d.ust_betrag / d.netto) * 100) : null,
    brutto: d.brutto,
    lieferant_name: d.lieferant_name,
    lieferant_ustid: d.lieferant_ustid,
    iban: null,
    gewerk: null,
    k1: null,
    confidence_ocr: 1,
    confidence_extraktion: 1,
  }
}

/**
 * Verarbeitet einen eingehenden Beleg zum Buchungsentwurf.
 * E-Rechnung → deterministischer Parse; sonst OCR + KI-Extraktion.
 */
export async function verarbeiteBeleg(
  input: PipelineInput,
  kontext: PipelineKontext,
  deps: PipelineDeps
): Promise<BelegEntwurf> {
  const gruende: string[] = []

  // 1. Weiche: E-Rechnung (ohne KI) vs. OCR-Pfad.
  let base: Partial<BelegEntwurf>
  if (input.content && istErechnung(input.content)) {
    base = ausErechnung(parseErechnung(input.content)!)
  } else {
    const text = input.content ?? (input.dataUrl ? await deps.ocr(input.dataUrl) : "")
    const confidence_ocr = text.trim().length > 0 ? 0.9 : 0
    if (confidence_ocr === 0) gruende.push("OCR ohne Text")
    const ex = await deps.extrahiere(text)
    base = {
      quelle: "ocr",
      belegnummer: ex.belegnummer,
      belegdatum: ex.belegdatum,
      netto: ex.netto,
      ust_betrag: ex.ust_betrag,
      ust_satz: ex.ust_satz,
      brutto: ex.brutto,
      lieferant_name: ex.lieferant_name,
      lieferant_ustid: ex.lieferant_ustid,
      iban: ex.iban,
      gewerk: ex.gewerk,
      k1: ex.k1,
      confidence_ocr,
      confidence_extraktion: ex.confidence,
    }
  }

  // 2. Deterministische Validierung.
  const pruef = pruefeBeleg(
    {
      netto: base.netto ?? null,
      brutto: base.brutto ?? null,
      ust_betrag: base.ust_betrag ?? null,
      ust_satz: base.ust_satz ?? null,
      belegdatum: base.belegdatum ?? null,
    },
    kontext.heute
  )
  gruende.push(...pruef.gruende)

  // 3. Deterministische Kontierung (Regel-Lookup).
  const k = kontiere(
    { gewerk: base.gewerk, lieferant: base.lieferant_name },
    kontext.regeln
  )
  let soll_konto: string | null = null
  let steuerschluessel: string | null = null
  let confidence_kontierung = 0
  if (k.matched) {
    soll_konto = k.soll_konto
    steuerschluessel = k.steuerschluessel
    confidence_kontierung = 1
  } else {
    gruende.push("Keine Kontierungsregel – Konto-Vorschlag nötig")
  }

  // 4. review_flag = echte Defekte (Validierung/Kontierung/OCR). Gating
  // entscheidet getrennt über Auto-Buchung vs. Mensch (kein Defekt).
  const review_flag = gruende.length > 0
  const conf = Math.min(
    base.confidence_ocr ?? 0,
    base.confidence_extraktion ?? 0,
    confidence_kontierung
  )
  const g = gating(conf, base.brutto ?? 0, kontext.gating)
  const auto_buchbar = g.auto_buchbar && !review_flag

  return {
    quelle: base.quelle!,
    belegnummer: base.belegnummer ?? null,
    belegdatum: base.belegdatum ?? null,
    netto: base.netto ?? null,
    ust_betrag: base.ust_betrag ?? null,
    ust_satz: base.ust_satz ?? null,
    brutto: base.brutto ?? null,
    lieferant_name: base.lieferant_name ?? null,
    lieferant_ustid: base.lieferant_ustid ?? null,
    iban: base.iban ?? null,
    gewerk: base.gewerk ?? null,
    k1: base.k1 ?? null,
    soll_konto,
    steuerschluessel,
    confidence_ocr: base.confidence_ocr ?? 0,
    confidence_extraktion: base.confidence_extraktion ?? 0,
    confidence_kontierung,
    review_flag,
    review_gruende: [...new Set(gruende)],
    auto_buchbar,
    status: auto_buchbar ? "gebucht" : "freigabe_offen",
  }
}
