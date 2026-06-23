import { describe, expect, it } from "vitest"

import {
  afaBemessungsgrundlage,
  afaJahresbetrag,
  restbuchwert,
  summeAfaIst,
} from "@/lib/utils/afa"

// Testing 50, Kap. 3.2 – AfA-Berechnung
describe("AfA", () => {
  it("Standard AfA 2%: 300.000 EUR -> 6.000 EUR/Jahr", () => {
    expect(afaJahresbetrag(300_000, 2)).toBe(6_000)
  })

  it("Optimierter Satz 3%: 300.000 EUR -> 9.000 EUR/Jahr", () => {
    expect(afaJahresbetrag(300_000, 3)).toBe(9_000)
  })

  it("Restbuchwert korrekt: 300.000, 2%, nach 5 Jahren -> 270.000 EUR", () => {
    expect(restbuchwert(300_000, 2, 5)).toBe(270_000)
  })

  it("Restbuchwert nie unter 0", () => {
    expect(restbuchwert(100_000, 5, 30)).toBe(0)
  })

  it("KPA-Gutachten: 20% Grundstück ergibt höhere Bemessungsgrundlage als 30%", () => {
    const mit20 = afaBemessungsgrundlage(400_000, 20)
    const mit30 = afaBemessungsgrundlage(400_000, 30)
    expect(mit20).toBe(320_000)
    expect(mit30).toBe(280_000)
    expect(mit20).toBeGreaterThan(mit30)
  })

  it("IST vs. PLAN: nur IST-Zeilen fließen in die Summe", () => {
    const summe = summeAfaIst([
      { betrag: 6_000, ist_oder_plan: "IST" },
      { betrag: 6_000, ist_oder_plan: "IST" },
      { betrag: 9_000, ist_oder_plan: "PLAN" },
    ])
    expect(summe).toBe(12_000)
  })
})
