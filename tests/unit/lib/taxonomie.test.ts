import { describe, expect, it } from "vitest"

import {
  aggregateNachPosition,
  mapKonto,
  summeJeArt,
  type TaxonomiePosition,
} from "@/lib/fibu/taxonomie"

const positionen: TaxonomiePosition[] = [
  { position_code: "E1", bezeichnung: "Mieterträge", mapping: { art: "ertrag", konten: ["8"] } },
  { position_code: "A1", bezeichnung: "Reinigung", mapping: { art: "aufwand", konten: ["4250"] } },
  { position_code: "A2", bezeichnung: "Sonstiger Aufwand", mapping: { art: "aufwand", konten: ["4"] } },
]

describe("mapKonto (Longest-Prefix)", () => {
  it("4250 → A1 (spezifischer als 4), 4240 → A2 (nur 4), 8400 → E1", () => {
    expect(mapKonto("4250", positionen)?.position_code).toBe("A1")
    expect(mapKonto("4240", positionen)?.position_code).toBe("A2")
    expect(mapKonto("8400", positionen)?.position_code).toBe("E1")
  })
  it("kein Treffer → null", () => {
    expect(mapKonto("1600", positionen)).toBeNull()
  })
})

describe("aggregateNachPosition", () => {
  const zeilen = [
    { konto: "8400", betrag: 1000 },
    { konto: "8500", betrag: 200 }, // auch E1 (Präfix 8)
    { konto: "4250", betrag: 150 }, // A1
    { konto: "4240", betrag: 300 }, // A2
    { konto: "1600", betrag: 999 }, // nicht zugeordnet
  ]
  const r = aggregateNachPosition(zeilen, positionen)

  it("rollt Konten in Positionen, sammelt beigetragende Konten", () => {
    const e1 = r.positionen.find((p) => p.position_code === "E1")!
    expect(e1.betrag).toBe(1200)
    expect(e1.konten).toEqual(["8400", "8500"])
    expect(r.positionen.find((p) => p.position_code === "A1")!.betrag).toBe(150)
    expect(r.positionen.find((p) => p.position_code === "A2")!.betrag).toBe(300)
  })

  it("nicht zugeordnete Konten separat", () => {
    expect(r.nichtZugeordnet).toEqual([{ konto: "1600", betrag: 999 }])
  })

  it("Positionen nach position_code sortiert", () => {
    expect(r.positionen.map((p) => p.position_code)).toEqual(["A1", "A2", "E1"])
  })

  it("summeJeArt: Ertrag/Aufwand/Ergebnis", () => {
    const s = summeJeArt(r.positionen)
    expect(s.ertrag).toBe(1200)
    expect(s.aufwand).toBe(450)
    expect(s.ergebnis).toBe(750)
  })
})
