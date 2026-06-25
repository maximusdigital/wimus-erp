import { describe, expect, it } from "vitest"

import { erstelleAbrechnung } from "@/lib/utils/bk-abrechnung"

// Spec 0001 / 30_prozesse Kap. 1 – BK-Abrechnungslauf
describe("erstelleAbrechnung", () => {
  const mitglieder = [
    { id: "v1", wert: 50, vorauszahlung: 600 }, // 50 m², 600 € VZ
    { id: "v2", wert: 30, vorauszahlung: 300 },
    { id: "v3", wert: 20, vorauszahlung: 200 },
  ]
  const positionen = [
    { id: "p1", bk_art_id: "muell", betrag: 600, schluessel: "flaeche" as const },
    { id: "p2", bk_art_id: "hausmeister", betrag: 400, schluessel: "einheit" as const },
  ]

  it("verteilt Positionen nach ihrem Schlüssel + summiert je Mietvertrag", () => {
    const r = erstelleAbrechnung(positionen, mitglieder, "flaeche")
    // v1: Müll 50% von 600 = 300, Hausmeister 1/3 von 400 = 133,33 → 433,33
    const v1 = r.zeilen.find((z) => z.id === "v1")!
    expect(v1.kostenAnteil).toBe(433.33)
    expect(v1.positionen).toHaveLength(2)
  })

  it("kostenGesamt = Summe aller Positionen; Verteilung geht exakt auf", () => {
    const r = erstelleAbrechnung(positionen, mitglieder, "flaeche")
    expect(r.kostenGesamt).toBe(1000)
    const summe = r.zeilen.reduce((s, z) => s + z.kostenAnteil, 0)
    expect(Math.round(summe)).toBe(1000)
  })

  it("Saldo = Vorauszahlung − Kostenanteil (Guthaben positiv, Nachzahlung negativ)", () => {
    const r = erstelleAbrechnung(positionen, mitglieder, "flaeche")
    const v1 = r.zeilen.find((z) => z.id === "v1")!
    expect(v1.saldo).toBe(round2(600 - v1.kostenAnteil))
    expect(r.vorauszahlungGesamt).toBe(1100)
  })

  it("Standard-Schlüssel greift, wenn Position keinen hat", () => {
    const r = erstelleAbrechnung(
      [{ id: "p", bk_art_id: "x", betrag: 1000 }],
      mitglieder,
      "einheit"
    )
    // Gleichteilung: je 333,33 / 333,33 / 333,34
    expect(r.zeilen.every((z) => Math.abs(z.kostenAnteil - 333.33) < 0.02)).toBe(true)
  })

  it("intern abgerechnetes Mitglied (KZV) trägt 0", () => {
    const r = erstelleAbrechnung(
      [{ id: "p", bk_art_id: "x", betrag: 900, schluessel: "einheit" }],
      [
        { id: "v1", wert: 1 },
        { id: "kzv", wert: 1, intern_abgerechnet: true },
      ],
      "einheit"
    )
    expect(r.zeilen.find((z) => z.id === "kzv")!.kostenAnteil).toBe(0)
    expect(r.zeilen.find((z) => z.id === "v1")!.kostenAnteil).toBe(900)
  })
})

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
