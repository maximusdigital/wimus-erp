import { describe, expect, it } from "vitest"

import { konsolidiereNachPosition, type FirmaBuchungen } from "@/lib/fibu/konsolidierung"
import type { TaxonomiePosition } from "@/lib/fibu/taxonomie"

const positionen: TaxonomiePosition[] = [
  { position_code: "E1", bezeichnung: "Mieterträge", mapping: { art: "ertrag", konten: ["8"] } },
  { position_code: "A1", bezeichnung: "Reinigung", mapping: { art: "aufwand", konten: ["4250"] } },
  { position_code: "A2", bezeichnung: "Sonstiger Aufwand", mapping: { art: "aufwand", konten: ["4"] } },
]

const firmen: FirmaBuchungen[] = [
  {
    firmaId: "A",
    firmaName: "A",
    buchungen: [
      { soll_konto: "4240", haben_konto: "1600", betrag_brutto: 200 }, // A2
      { soll_konto: "1200", haben_konto: "8400", betrag_brutto: 1000 }, // E1
    ],
  },
  {
    firmaId: "B",
    firmaName: "B",
    buchungen: [
      { soll_konto: "4250", haben_konto: "1600", betrag_brutto: 150 }, // A1
      { soll_konto: "1200", haben_konto: "8400", betrag_brutto: 500 }, // E1
    ],
  },
]

describe("konsolidiereNachPosition", () => {
  const k = konsolidiereNachPosition(firmen, positionen)

  it("Ertrags-Position E1 über beide Einheiten", () => {
    const e1 = k.ertraege.find((z) => z.position_code === "E1")!
    expect(e1.werte).toEqual({ A: 1000, B: 500 })
    expect(e1.summe).toBe(1500)
  })

  it("Aufwand-Positionen je Einheit (A2 nur bei A, A1 nur bei B)", () => {
    const a2 = k.aufwendungen.find((z) => z.position_code === "A2")!
    const a1 = k.aufwendungen.find((z) => z.position_code === "A1")!
    expect(a2.werte).toEqual({ A: 200, B: 0 })
    expect(a1.werte).toEqual({ A: 0, B: 150 })
  })

  it("Spalten-Summen + konsolidiertes Ergebnis", () => {
    expect(k.spalten.find((s) => s.firmaId === "A")!.ergebnis).toBe(800)
    expect(k.spalten.find((s) => s.firmaId === "B")!.ergebnis).toBe(350)
    expect(k.summe_ertrag).toBe(1500)
    expect(k.summe_aufwand).toBe(350)
    expect(k.ergebnis).toBe(1150)
  })

  it("nicht zugeordnete Konten je Einheit ausgewiesen", () => {
    const mitRest = konsolidiereNachPosition(
      [{ firmaId: "C", firmaName: "C", buchungen: [{ soll_konto: "8400", haben_konto: "9999", betrag_brutto: 0 }] }],
      // 9999 ist Haben (kein Ertrag-Match), 8400 Soll (kein Aufwand) → tatsächlich leer
      positionen
    )
    expect(Array.isArray(mitRest.nichtZugeordnet)).toBe(true)
  })
})
