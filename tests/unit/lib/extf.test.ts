import { describe, expect, it } from "vitest"

import { extfBuchungsstapel, type ExtfBuchung, type ExtfMeta } from "@/lib/utils/extf"

const META: ExtfMeta = {
  berater_nr: 1234567,
  mandant_nr: 70,
  wj_beginn: "2025-01-01",
  datum_von: "2025-01-01",
  datum_bis: "2025-12-31",
  bezeichnung: "ALFA CAMPUS 2025",
  erzeugt_am: "20260626120000000",
}

const BUCHUNGEN: ExtfBuchung[] = [
  {
    umsatz: 119.0,
    soll_haben: "S",
    konto: "4250",
    gegenkonto: "1200",
    belegdatum: "2025-03-15",
    belegfeld1: "RE-2025-0042",
    buchungstext: "Reinigung Treppenhaus",
    kost1: "AS125",
    kost2: "AS125W2",
    buchungs_id: "WIMUS-abcd1234",
  },
]

// Spec 0002 / 60_tests – Export (Integration): EXTF, KOST1=K1/KOST2=K2, BuchungsID
describe("extfBuchungsstapel", () => {
  const csv = extfBuchungsstapel(BUCHUNGEN, META)
  const zeilen = csv.split("\r\n")

  it("Header beginnt mit EXTF / 700 / 21 / Buchungsstapel", () => {
    expect(zeilen[0].startsWith('"EXTF";700;21;"Buchungsstapel"')).toBe(true)
  })

  it("Header enthält Berater-/Mandantennr + WJ + Zeitraum (YYYYMMDD)", () => {
    const f = zeilen[0].split(";")
    expect(f[11]).toBe("1234567")
    expect(f[12]).toBe("70")
    expect(f[13]).toBe("20250101")
    expect(f[15]).toBe("20250101")
    expect(f[16]).toBe("20251231")
  })

  it("Spaltenzeile listet KOST1, KOST2, BuchungsID", () => {
    expect(zeilen[1]).toContain('"KOST1"')
    expect(zeilen[1]).toContain('"KOST2"')
    expect(zeilen[1]).toContain('"BuchungsID"')
  })

  it("Datenzeile: Betrag deutsch, S/H, Konten, KOST=K1/K2, ID", () => {
    const d = zeilen[2].split(";")
    expect(d[0]).toBe("119,00") // Komma, 2 NK
    expect(d[1]).toBe('"S"')
    expect(d[2]).toBe('"EUR"')
    expect(d[3]).toBe('"4250"')
    expect(d[4]).toBe('"1200"')
    expect(d[6]).toBe("1503") // Belegdatum TTMM
    expect(d[7]).toBe('"RE-2025-0042"')
    expect(d[9]).toBe('"AS125"') // KOST1 = K1
    expect(d[10]).toBe('"AS125W2"') // KOST2 = K2
    expect(d[11]).toBe('"WIMUS-abcd1234"')
  })

  it("Spalten- und Datenzeile haben gleiche Feldzahl (konsistent)", () => {
    expect(zeilen[2].split(";").length).toBe(zeilen[1].split(";").length)
  })

  it("CRLF-Zeilenenden + abschließendes CRLF", () => {
    expect(csv.endsWith("\r\n")).toBe(true)
    expect(csv.includes("\r\n")).toBe(true)
  })

  it("Anführungszeichen im Text werden verdoppelt (CSV-Escape)", () => {
    const csv2 = extfBuchungsstapel(
      [{ ...BUCHUNGEN[0], buchungstext: 'Strom "Haupthaus"' }],
      META
    )
    expect(csv2).toContain('"Strom ""Haupthaus"""')
  })

  it("Buchungstext wird auf 60 Zeichen begrenzt", () => {
    const lang = "x".repeat(80)
    const csv2 = extfBuchungsstapel([{ ...BUCHUNGEN[0], buchungstext: lang }], META)
    const d = csv2.split("\r\n")[2].split(";")
    expect(d[8]).toBe(`"${"x".repeat(60)}"`)
  })
})
