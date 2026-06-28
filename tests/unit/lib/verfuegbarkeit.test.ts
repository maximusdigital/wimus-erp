import { describe, expect, it } from "vitest"

import {
  ueberlappt,
  findeKollisionen,
  istVerfuegbar,
  type Belegung,
} from "@/lib/belegung/verfuegbarkeit"

describe("ueberlappt (halboffen)", () => {
  it("klarer Overlap", () => {
    expect(ueberlappt("2026-06-01", "2026-06-10", "2026-06-05", "2026-06-15")).toBe(true)
  })
  it("kein Overlap (getrennt)", () => {
    expect(ueberlappt("2026-06-01", "2026-06-05", "2026-06-10", "2026-06-15")).toBe(false)
  })
  it("Rand-Tag: Check-out = Check-in ist frei", () => {
    expect(ueberlappt("2026-06-05", "2026-06-10", "2026-06-01", "2026-06-05")).toBe(false)
  })
  it("offenes Ende (bis=null) läuft unbegrenzt", () => {
    expect(ueberlappt("2026-09-01", "2026-09-05", "2026-01-01", null)).toBe(true)
  })
})

describe("findeKollisionen + istVerfuegbar", () => {
  const quellen: Belegung[] = [
    { quelle: "buchung", ref_id: "b1", von: "2026-06-01", bis: "2026-06-05" },
    { quelle: "mietvertrag", ref_id: "m1", von: "2026-01-01", bis: null }, // offen
    { quelle: "sperre", ref_id: "s1", von: "2026-07-01", bis: "2026-07-10" },
  ]

  it("frei, wenn keine Quelle überlappt", () => {
    const r = istVerfuegbar("2026-06-06", "2026-06-30", [quellen[0], quellen[2]])
    expect(r.frei).toBe(true)
    expect(r.kollisionen).toHaveLength(0)
  })

  it("Multi-Quellen-Kollision (Buchung + offener MV)", () => {
    const k = findeKollisionen("2026-06-01", "2026-06-10", quellen)
    // überlappt b1 (06-01..06-05) und m1 (offen ab 01-01)
    expect(k.map((x) => x.ref_id).sort()).toEqual(["b1", "m1"])
  })

  it("ausser: eigenen Eintrag ausnehmen (Bearbeiten)", () => {
    const k = findeKollisionen("2026-06-01", "2026-06-05", quellen, { quelle: "buchung", id: "b1" })
    // b1 ausgenommen, bleibt nur der offene MV m1
    expect(k.map((x) => x.ref_id)).toEqual(["m1"])
  })

  it("offener MV blockt späteren Zeitraum", () => {
    const r = istVerfuegbar("2027-01-01", "2027-01-05", [quellen[1]])
    expect(r.frei).toBe(false)
    expect(r.kollisionen[0].ref_id).toBe("m1")
  })
})
