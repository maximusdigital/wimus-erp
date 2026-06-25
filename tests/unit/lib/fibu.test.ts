import { describe, expect, it } from "vitest"

import {
  buchungsIdExtern,
  ergebnisverteilung,
  kontiere,
  type Beteiligung,
  type Kontierungsregel,
} from "@/lib/utils/fibu"

// Spec 0002 / 20_datenmodell – Ergebnisverteilung periodengenau (zeitanteilig)
describe("ergebnisverteilung", () => {
  it("ganzjährig konstante Quoten → reine Quotenverteilung", () => {
    const bet: Beteiligung[] = [
      { gesellschafter_id: "A", quote: 0.6, gueltig_ab: "2025-01-01", gueltig_bis: null },
      { gesellschafter_id: "B", quote: 0.4, gueltig_ab: "2025-01-01", gueltig_bis: null },
    ]
    const v = ergebnisverteilung(bet, 100000, "2025-01-01", "2025-12-31")
    expect(v.find((x) => x.gesellschafter_id === "A")?.anteil_betrag).toBe(60000)
    expect(v.find((x) => x.gesellschafter_id === "B")?.anteil_betrag).toBe(40000)
  })

  it("unterjähriger Quotenwechsel → zeitanteilig gewichtet", () => {
    // A hält H1 100%, dann tritt B zur Jahresmitte mit 50% ein.
    const bet: Beteiligung[] = [
      { gesellschafter_id: "A", quote: 1.0, gueltig_ab: "2025-01-01", gueltig_bis: "2025-06-30" },
      { gesellschafter_id: "A", quote: 0.5, gueltig_ab: "2025-07-01", gueltig_bis: null },
      { gesellschafter_id: "B", quote: 0.5, gueltig_ab: "2025-07-01", gueltig_bis: null },
    ]
    const v = ergebnisverteilung(bet, 100000, "2025-01-01", "2025-12-31")
    const a = v.find((x) => x.gesellschafter_id === "A")!
    const b = v.find((x) => x.gesellschafter_id === "B")!
    // A ≈ 181/365*1 + 184/365*0.5 ≈ 0.7479 ; B ≈ 0.2521
    expect(a.anteil_betrag).toBeGreaterThan(74000)
    expect(a.anteil_betrag).toBeLessThan(75500)
    // Summe exakt = ergebnis (Rundungsrest beim letzten)
    expect(a.anteil_betrag + b.anteil_betrag).toBe(100000)
  })

  it("Summe entspricht immer dem Ergebnis (Rundungsrest)", () => {
    const bet: Beteiligung[] = [
      { gesellschafter_id: "A", quote: 1 / 3, gueltig_ab: "2025-01-01", gueltig_bis: null },
      { gesellschafter_id: "B", quote: 1 / 3, gueltig_ab: "2025-01-01", gueltig_bis: null },
      { gesellschafter_id: "C", quote: 1 / 3, gueltig_ab: "2025-01-01", gueltig_bis: null },
    ]
    const v = ergebnisverteilung(bet, 1000, "2025-01-01", "2025-12-31")
    expect(v.reduce((s, x) => s + x.anteil_betrag, 0)).toBe(1000)
  })

  it("leere Periode → leeres Ergebnis", () => {
    expect(ergebnisverteilung([], 1000, "2025-12-31", "2025-01-01")).toEqual([])
  })

  it("negatives Ergebnis (Verlust) wird ebenso verteilt", () => {
    const bet: Beteiligung[] = [
      { gesellschafter_id: "A", quote: 0.5, gueltig_ab: "2025-01-01", gueltig_bis: null },
      { gesellschafter_id: "B", quote: 0.5, gueltig_ab: "2025-01-01", gueltig_bis: null },
    ]
    const v = ergebnisverteilung(bet, -20000, "2025-01-01", "2025-12-31")
    expect(v[0].anteil_betrag).toBe(-10000)
    expect(v[1].anteil_betrag).toBe(-10000)
  })
})

// Spec 0002 – deterministische Kontierung (Regel-Lookup, kein LLM-Drift)
describe("kontiere", () => {
  const regeln: Kontierungsregel[] = [
    { id: "r1", match: "reinigung", soll_konto: "4250", ust_satz: 19, steuerschluessel: "9", prioritaet: 10 },
    { id: "r2", match: "strom", soll_konto: "4240", ust_satz: 19, steuerschluessel: "9", prioritaet: 10 },
    { id: "r3", match: "versicherung", soll_konto: "4360", ust_satz: null, steuerschluessel: null, prioritaet: 5 },
  ]

  it("trifft Regel über das Gewerk", () => {
    const r = kontiere({ gewerk: "Reinigung Treppenhaus" }, regeln)
    expect(r.matched).toBe(true)
    if (r.matched) expect(r.soll_konto).toBe("4250")
  })

  it("trifft Regel über den Lieferanten", () => {
    const r = kontiere({ lieferant: "Stadtwerke Strom GmbH" }, regeln)
    expect(r.matched && r.soll_konto).toBe("4240")
  })

  it("Priorität entscheidet bei mehreren Treffern", () => {
    const r = kontiere({ gewerk: "Versicherung", lieferant: "Reinigung" }, regeln)
    // r3 (prio 5) vor r1 (prio 10)
    expect(r.matched && r.regel_id).toBe("r3")
  })

  it("keine passende Regel → review_flag", () => {
    const r = kontiere({ gewerk: "Notarkosten" }, regeln)
    expect(r.matched).toBe(false)
    expect(r.review_flag).toBe(true)
  })
})

// Spec 0002 – stabile Buchungs-ID (TaxPool-Dublettenerkennung)
describe("buchungsIdExtern", () => {
  const beleg = {
    einheit_id: "11111111-1111-1111-1111-111111111111",
    belegnummer: "RE-2025-0042",
    belegdatum: "2025-03-15",
    betrag_brutto: 1190.0,
  }

  it("deterministisch – gleicher Beleg, gleiche ID", () => {
    expect(buchungsIdExtern(beleg)).toBe(buchungsIdExtern({ ...beleg }))
  })
  it("Belegnummer case-/whitespace-insensitiv", () => {
    expect(buchungsIdExtern(beleg)).toBe(
      buchungsIdExtern({ ...beleg, belegnummer: "  re-2025-0042 " })
    )
  })
  it("anderer Betrag → andere ID", () => {
    expect(buchungsIdExtern(beleg)).not.toBe(buchungsIdExtern({ ...beleg, betrag_brutto: 1200 }))
  })
  it("Format WIMUS-<8 hex>", () => {
    expect(buchungsIdExtern(beleg)).toMatch(/^WIMUS-[0-9a-f]{8}$/)
  })
})
