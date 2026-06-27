import { describe, expect, it } from "vitest"

import { konsolidiereGuV, type FirmaBuchungen } from "@/lib/fibu/konsolidierung"

const firmen: FirmaBuchungen[] = [
  {
    firmaId: "A",
    firmaName: "Firma A",
    buchungen: [
      { soll_konto: "4240", haben_konto: "1600", betrag_brutto: 200 }, // Aufwand
      { soll_konto: "1200", haben_konto: "8400", betrag_brutto: 1000 }, // Ertrag
    ],
  },
  {
    firmaId: "B",
    firmaName: "Firma B",
    buchungen: [
      { soll_konto: "4240", haben_konto: "1600", betrag_brutto: 100 }, // gleiches Aufwand-Konto
      { soll_konto: "4250", haben_konto: "1600", betrag_brutto: 50 }, // anderes Aufwand-Konto
      { soll_konto: "1200", haben_konto: "8400", betrag_brutto: 500 }, // Ertrag
    ],
  },
]

describe("konsolidiereGuV", () => {
  const k = konsolidiereGuV(firmen)

  it("Spalten je Firma mit Ergebnis", () => {
    expect(k.spalten).toHaveLength(2)
    expect(k.spalten[0]).toMatchObject({ firmaId: "A", summe_ertrag: 1000, summe_aufwand: 200, ergebnis: 800 })
    expect(k.spalten[1]).toMatchObject({ firmaId: "B", summe_ertrag: 500, summe_aufwand: 150, ergebnis: 350 })
  })

  it("Aufwand-Matrix: gemeinsames Konto 4240 wird je Firma + Summe geführt", () => {
    const z4240 = k.aufwendungen.find((z) => z.konto === "4240")!
    expect(z4240.werte).toEqual({ A: 200, B: 100 })
    expect(z4240.summe).toBe(300)
    const z4250 = k.aufwendungen.find((z) => z.konto === "4250")!
    expect(z4250.werte).toEqual({ A: 0, B: 50 })
    expect(z4250.summe).toBe(50)
  })

  it("Ertrag-Matrix: Konto 8400 über beide Firmen", () => {
    const z = k.ertraege.find((x) => x.konto === "8400")!
    expect(z.werte).toEqual({ A: 1000, B: 500 })
    expect(z.summe).toBe(1500)
  })

  it("konsolidierte Summen + Ergebnis", () => {
    expect(k.summe_ertrag).toBe(1500)
    expect(k.summe_aufwand).toBe(350)
    expect(k.ergebnis).toBe(1150)
  })

  it("leere Auswahl → Nullen", () => {
    const e = konsolidiereGuV([])
    expect(e.spalten).toEqual([])
    expect(e.ergebnis).toBe(0)
    expect(e.ertraege).toEqual([])
  })
})
