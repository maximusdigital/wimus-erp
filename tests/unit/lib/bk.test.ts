import { describe, expect, it } from "vitest"

import {
  hkvoToepfe,
  verbrauchKwh,
  verteileKosten,
  warmwasserKosten,
} from "@/lib/utils/bk"

// Spec 0001 / 30_prozesse Kap. 1 – Betriebskosten-Kernlogik
describe("verbrauchKwh", () => {
  it("Gas: m³ × Brennwert × Zustandszahl", () => {
    expect(verbrauchKwh("gas", 1000, { brennwert: 10, zustandszahl: 0.95 })).toBe(9500)
  })
  it("Heizöl: Liter × 9,8", () => {
    expect(verbrauchKwh("heizoel", 100)).toBe(980)
  })
  it("Pellets: kg × 4,8", () => {
    expect(verbrauchKwh("pellets", 1000)).toBe(4800)
  })
  it("kWh direkt (Strom/Fernwärme)", () => {
    expect(verbrauchKwh("kwh", 3500)).toBe(3500)
  })
})

describe("warmwasserKosten", () => {
  it("18% der Heizkosten (HKVO §9 Default)", () => {
    expect(warmwasserKosten(1000)).toBe(180)
  })
  it("anpassbarer Prozentsatz", () => {
    expect(warmwasserKosten(1000, 20)).toBe(200)
  })
})

describe("hkvoToepfe", () => {
  it("70% Verbrauch / 30% Fläche (Default)", () => {
    expect(hkvoToepfe(1000)).toEqual({ verbrauchTopf: 700, flaecheTopf: 300 })
  })
  it("50/50 konfigurierbar", () => {
    expect(hkvoToepfe(1000, 50)).toEqual({ verbrauchTopf: 500, flaecheTopf: 500 })
  })
})

describe("verteileKosten", () => {
  const mitglieder = [
    { id: "a", wert: 50 }, // 50 m²
    { id: "b", wert: 30 },
    { id: "c", wert: 20 },
  ]

  it("nach Fläche: anteilig + Summe geht exakt auf", () => {
    const r = verteileKosten(1000, mitglieder, "flaeche")
    expect(r.find((x) => x.id === "a")?.betrag).toBe(500)
    expect(r.find((x) => x.id === "b")?.betrag).toBe(300)
    expect(r.find((x) => x.id === "c")?.betrag).toBe(200)
    expect(r.reduce((s, x) => s + x.betrag, 0)).toBe(1000)
  })

  it("nach Einheit (Gleichteilung)", () => {
    const r = verteileKosten(900, mitglieder, "einheit")
    expect(r.every((x) => x.betrag === 300)).toBe(true)
  })

  it("intern abgerechnet (KZV) trägt 0, Rest verteilt sich", () => {
    const r = verteileKosten(
      1000,
      [
        { id: "a", wert: 50 },
        { id: "kzv", wert: 50, intern_abgerechnet: true },
      ],
      "flaeche"
    )
    expect(r.find((x) => x.id === "kzv")?.betrag).toBe(0)
    expect(r.find((x) => x.id === "a")?.betrag).toBe(1000)
  })

  it("individuell: fester Anteil in %", () => {
    const r = verteileKosten(
      1000,
      [
        { id: "a", fester_anteil_pct: 60 },
        { id: "b", fester_anteil_pct: 40 },
      ],
      "individuell"
    )
    expect(r.find((x) => x.id === "a")?.betrag).toBe(600)
    expect(r.find((x) => x.id === "b")?.betrag).toBe(400)
  })

  it("Rundung: Summe bleibt exakt (Drittel)", () => {
    const r = verteileKosten(
      100,
      [
        { id: "a", wert: 1 },
        { id: "b", wert: 1 },
        { id: "c", wert: 1 },
      ],
      "flaeche"
    )
    expect(r.reduce((s, x) => s + x.betrag, 0)).toBe(100)
  })
})
