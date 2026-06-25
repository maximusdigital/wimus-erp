import { describe, expect, it } from "vitest"

import {
  kautionVerrechnung,
  offenerBetrag,
  schadenEskalation,
} from "@/lib/utils/forderungen"

// Spec 0001 / 30_prozesse Kap. 3 – Forderungsmanagement
describe("schadenEskalation", () => {
  it("< 50 € → Stufe 1: Kaution direkt", () => {
    const e = schadenEskalation(30)
    expect(e.stufe).toBe(1)
    expect(e.kaution).toBe(true)
    expect(e.mahnung).toBe(false)
  })

  it("50–500 € → Stufe 2: Kaution + Mahnung", () => {
    const e = schadenEskalation(300)
    expect(e.stufe).toBe(2)
    expect(e.kaution).toBe(true)
    expect(e.mahnung).toBe(true)
  })

  it("500–5.000 € → Stufe 3: Kaution + Versicherung", () => {
    const e = schadenEskalation(2000)
    expect(e.stufe).toBe(3)
    expect(e.versicherung).toBe(true)
  })

  it("5.000–10.000 € → Stufe 4: Versicherung + Mahnbescheid", () => {
    const e = schadenEskalation(8000)
    expect(e.stufe).toBe(4)
    expect(e.mahnbescheid).toBe(true)
    expect(e.anwalt).toBe(false)
  })

  it("> 10.000 € → Stufe 5: Anwalt", () => {
    const e = schadenEskalation(15000)
    expect(e.stufe).toBe(5)
    expect(e.anwalt).toBe(true)
  })

  it("Grenzwerte: 50/500/5000/10000 springen in die nächste Stufe", () => {
    expect(schadenEskalation(50).stufe).toBe(2)
    expect(schadenEskalation(500).stufe).toBe(3)
    expect(schadenEskalation(5000).stufe).toBe(4)
    expect(schadenEskalation(10000).stufe).toBe(5)
  })
})

describe("offenerBetrag", () => {
  it("betrag − bezahlt_betrag", () => {
    expect(offenerBetrag({ betrag: 1000, bezahlt_betrag: 300 })).toBe(700)
  })
  it("ohne Teilzahlung = voller Betrag", () => {
    expect(offenerBetrag({ betrag: 850, bezahlt_betrag: null })).toBe(850)
  })
})

describe("kautionVerrechnung", () => {
  it("Rest positiv → Rückzahlung an Mieter", () => {
    const r = kautionVerrechnung(800, 2000)
    expect(r.verrechnet).toBe(800)
    expect(r.rueckzahlung).toBe(1200)
    expect(r.nachforderung).toBe(0)
  })

  it("Rest negativ → Nachforderung", () => {
    const r = kautionVerrechnung(2500, 2000)
    expect(r.verrechnet).toBe(2000)
    expect(r.rueckzahlung).toBe(0)
    expect(r.nachforderung).toBe(500)
  })

  it("exakt aufgehend → weder Rück- noch Nachforderung", () => {
    const r = kautionVerrechnung(2000, 2000)
    expect(r.rueckzahlung).toBe(0)
    expect(r.nachforderung).toBe(0)
  })
})
