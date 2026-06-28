import { describe, expect, it } from "vitest"

import { matchUmsatz, type MatchKontext } from "@/lib/fibu/bank-match"
import type { BankZeile } from "@/lib/fibu/bank-csv"

const ctx: MatchKontext = {
  einheiten: [{ id: "e1", objekt_id: "o1", code: "BHS16W3Z1" }],
  objekte: [{ id: "o1", kuerzel: "BHS16" }],
  mieter: [
    {
      mietvertrag_id: "m1",
      objekt_id: "o1",
      einheit_id: "e1",
      name: "Mustermann, Max",
      offene_miete: 800,
    },
  ],
  kontoinhaber: ["WIMUS Hausverwaltung"],
}

function zeile(p: Partial<BankZeile>): BankZeile {
  return {
    wertstellung: "2026-06-02",
    empfaenger: "",
    verwendungszweck: "",
    kategorie_wiso: "",
    betrag: 800,
    saldo: null,
    richtung: "einnahme",
    ...p,
  }
}

describe("matchUmsatz", () => {
  it("K1 + Name + Betrag stimmig → auto (methode k1)", () => {
    const m = matchUmsatz(
      zeile({ empfaenger: "Max Mustermann", verwendungszweck: "Miete BHS16W3Z1 Juni", betrag: 800 }),
      ctx
    )
    expect(m.routing).toBe("auto")
    expect(m.match_methode).toBe("k1")
    expect(m.einheit_id).toBe("e1")
    expect(m.objekt_id).toBe("o1")
    expect(m.mietvertrag_id).toBe("m1")
    expect(m.erkanntes_k1).toBe("BHS16W3Z1")
  })

  it("Vorfilter: Geldtransit → ignoriert", () => {
    const m = matchUmsatz(
      zeile({ empfaenger: "KSKLB-KSKLB", verwendungszweck: "GT KSK Geldtransit", betrag: -1128.87, richtung: "ausgabe" }),
      ctx
    )
    expect(m.ignoriert).toBe(true)
    expect(m.routing).toBe("ignoriert")
  })

  it("nur Name (kein K1) → name-Match, Objekt aus Mieter", () => {
    const m = matchUmsatz(
      zeile({ empfaenger: "Max Mustermann", verwendungszweck: "Mietzahlung Juni", betrag: 800 }),
      ctx
    )
    expect(m.match_methode).toBe("name")
    expect(m.mietvertrag_id).toBe("m1")
    expect(m.objekt_id).toBe("o1")
    expect(["auto", "pruefen"]).toContain(m.routing)
  })

  it("Ausgabe mit K1 → kein Mieter/OP, nicht auto", () => {
    const m = matchUmsatz(
      zeile({ empfaenger: "Stadtwerke", verwendungszweck: "Strom BHS16W3Z1", betrag: -120, richtung: "ausgabe" }),
      ctx
    )
    expect(m.mietvertrag_id).toBeNull()
    expect(m.einheit_id).toBe("e1")
    expect(m.routing).not.toBe("auto")
  })

  it("kein Treffer → klaeren", () => {
    const m = matchUmsatz(
      zeile({ empfaenger: "Unbekannt XYZ", verwendungszweck: "irgendwas", betrag: 42 }),
      ctx
    )
    expect(m.match_methode).toBeNull()
    expect(m.routing).toBe("klaeren")
  })
})
