import { describe, expect, it } from "vitest"

import {
  parseDeutschesDatum,
  parseDeutscherBetrag,
  parseKskCsv,
} from "@/lib/fibu/bank-csv"

describe("parseDeutschesDatum", () => {
  it("TT.MM.JJJJ HH:MM:SS → ISO", () => {
    expect(parseDeutschesDatum("02.06.2026 00:00:00")).toBe("2026-06-02")
    expect(parseDeutschesDatum("9.3.2026")).toBe("2026-03-09")
  })
  it("ungültig → null", () => {
    expect(parseDeutschesDatum("2026-06-02")).toBeNull()
    expect(parseDeutschesDatum("")).toBeNull()
    expect(parseDeutschesDatum("32.13.2026")).toBeNull()
  })
})

describe("parseDeutscherBetrag", () => {
  it("deutsches Format mit Tausenderpunkt + Komma", () => {
    expect(parseDeutscherBetrag("-1.128,87")).toBe(-1128.87)
    expect(parseDeutscherBetrag("800,00")).toBe(800)
    expect(parseDeutscherBetrag("+5,50")).toBe(5.5)
  })
  it("ungültig/leer → null", () => {
    expect(parseDeutscherBetrag("")).toBeNull()
    expect(parseDeutscherBetrag(null)).toBeNull()
    expect(parseDeutscherBetrag("abc")).toBeNull()
  })
})

describe("parseKskCsv", () => {
  const CSV =
    "Wertstellung;Empfänger/Auftraggeber;Verwendungszweck;Kategorie;Betrag;Stand\r\n" +
    "02.06.2026 00:00:00;Max Mustermann;Miete BHS16W3Z1 Juni;Einnahmen;800,00;12.345,67\r\n" +
    "01.06.2026 00:00:00;KSKLB-KSKLB;GT KSK Geldtransit;Umbuchung;-1.128,87;11.545,67\r\n"

  it("parst Zeilen mit richtung aus Vorzeichen", () => {
    const r = parseKskCsv(CSV)
    expect(r.fehler).toHaveLength(0)
    expect(r.zeilen).toHaveLength(2)
    expect(r.zeilen[0]).toMatchObject({
      wertstellung: "2026-06-02",
      empfaenger: "Max Mustermann",
      betrag: 800,
      saldo: 12345.67,
      richtung: "einnahme",
    })
    expect(r.zeilen[1]).toMatchObject({ betrag: -1128.87, richtung: "ausgabe" })
  })

  it("fehlende Pflichtspalten → Fehler", () => {
    const r = parseKskCsv("Foo;Bar\r\n1;2\r\n")
    expect(r.zeilen).toHaveLength(0)
    expect(r.fehler.length).toBeGreaterThan(0)
  })
})
