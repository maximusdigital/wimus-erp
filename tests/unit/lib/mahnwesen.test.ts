import { describe, expect, it } from "vitest"

import {
  anwaltszwang,
  istUnterAgSchwelle,
  mahnGesamt,
  mahngebuehr,
  mahnzinsen,
  naechsteStufe,
  sollMahnungSenden,
} from "@/lib/utils/mahnwesen"

// Testing 50, Kap. 3.3 – Mahnwesen 5-stufig
describe("Mahnwesen", () => {
  it("Stufe 1 korrekt: keine Gebühren", () => {
    expect(mahngebuehr(1)).toBe(0)
  })

  it("Höhere Stufen haben Gebühren", () => {
    expect(mahngebuehr(2)).toBe(5)
    expect(mahngebuehr(3)).toBe(10)
    expect(mahngebuehr(4)).toBe(15)
  })

  it("Stufe 2 mit Zinsen: Hauptforderung × Zinssatz × Tage (taggenau)", () => {
    // 500 € × 5 % p.a. × 14 Tage / 365 = 0,96 €
    expect(mahnzinsen(500, 5, 14)).toBe(0.96)
    // Keine Zinsen bei 0 Tagen
    expect(mahnzinsen(500, 5, 0)).toBe(0)
  })

  it("Gesamtforderung = Haupt + Zinsen + Gebühren", () => {
    expect(mahnGesamt(500, 0.96, 5)).toBe(505.96)
  })

  it("AG-Schwelle < 10.000 EUR: kein Anwaltszwang, AG empfohlen", () => {
    expect(istUnterAgSchwelle(8_500)).toBe(true)
    expect(anwaltszwang(8_500)).toBe(false)
  })

  it("Über AG-Schwelle: Anwaltszwang", () => {
    expect(istUnterAgSchwelle(12_000)).toBe(false)
    expect(anwaltszwang(12_000)).toBe(true)
  })

  it("Idempotenz: bereits versendete Mahnung wird nicht erneut gesendet", () => {
    expect(sollMahnungSenden(null)).toBe(true)
    expect(sollMahnungSenden("")).toBe(true)
    expect(sollMahnungSenden("2026-06-01")).toBe(false)
  })

  it("Nächste Stufe zählt hoch, deckelt bei 5", () => {
    expect(naechsteStufe(1)).toBe(2)
    expect(naechsteStufe(4)).toBe(5)
    expect(naechsteStufe(5)).toBe(5)
  })
})
