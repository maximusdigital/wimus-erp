import { describe, expect, it } from "vitest"

import { aggregateGuV, kontoGruppe, type GuvBuchung } from "@/lib/fibu/guv"

describe("kontoGruppe (SKR03)", () => {
  it("4xxx = Aufwand, 8xxx = Ertrag, sonst neutral", () => {
    expect(kontoGruppe("4240")).toBe("aufwand")
    expect(kontoGruppe("8400")).toBe("ertrag")
    expect(kontoGruppe("1600")).toBe("neutral")
    expect(kontoGruppe(null)).toBe("neutral")
  })
})

describe("aggregateGuV", () => {
  const b: GuvBuchung[] = [
    { soll_konto: "4240", haben_konto: "1600", betrag_brutto: 119 }, // Aufwand Strom
    { soll_konto: "4240", haben_konto: "1600", betrag_brutto: 81 }, // Aufwand Strom
    { soll_konto: "4250", haben_konto: "1600", betrag_brutto: 200 }, // Aufwand Reinigung
    { soll_konto: "1200", haben_konto: "8400", betrag_brutto: 1000 }, // Ertrag Miete
  ]

  it("summiert Aufwand je Konto, Ertrag je Konto, Ergebnis", () => {
    const g = aggregateGuV(b)
    expect(g.aufwendungen).toEqual([
      { konto: "4240", betrag: 200 },
      { konto: "4250", betrag: 200 },
    ])
    expect(g.ertraege).toEqual([{ konto: "8400", betrag: 1000 }])
    expect(g.summe_aufwand).toBe(400)
    expect(g.summe_ertrag).toBe(1000)
    expect(g.ergebnis).toBe(600)
  })

  it("leer → Nullen", () => {
    const g = aggregateGuV([])
    expect(g.ergebnis).toBe(0)
    expect(g.aufwendungen).toEqual([])
  })

  it("neutrale Konten zählen nicht in die GuV", () => {
    const g = aggregateGuV([{ soll_konto: "1600", haben_konto: "1200", betrag_brutto: 500 }])
    expect(g.summe_aufwand).toBe(0)
    expect(g.summe_ertrag).toBe(0)
  })
})
