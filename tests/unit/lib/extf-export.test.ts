import { describe, expect, it } from "vitest"

import {
  baueExtfExport,
  mapBuchungZuExtf,
  type ExportBuchung,
} from "@/lib/fibu/extf-export"

const BUCHUNG: ExportBuchung = {
  datum: "2025-03-15",
  soll_konto: "4240",
  haben_konto: "1600",
  betrag_brutto: 119,
  ust_schluessel: "9",
  k1: "AS125",
  k2: "AS125W2",
  buchungstext: "Stadtwerke RE-1",
  buchungs_id_extern: "WIMUS-abcd1234",
  beleg: { belegnummer: "RE-1", belegdatum: "2025-03-15" },
}

describe("mapBuchungZuExtf", () => {
  it("bildet Konto/Gegenkonto, KOST, Belegfeld, ID korrekt ab", () => {
    const e = mapBuchungZuExtf(BUCHUNG)
    expect(e.umsatz).toBe(119)
    expect(e.soll_haben).toBe("S")
    expect(e.konto).toBe("4240")
    expect(e.gegenkonto).toBe("1600")
    expect(e.belegfeld1).toBe("RE-1")
    expect(e.kost1).toBe("AS125")
    expect(e.kost2).toBe("AS125W2")
    expect(e.buchungs_id).toBe("WIMUS-abcd1234")
  })
  it("fällt auf Beleg-Datum zurück, wenn Buchungsdatum fehlt", () => {
    expect(mapBuchungZuExtf({ ...BUCHUNG, datum: null }).belegdatum).toBe("2025-03-15")
  })
})

describe("baueExtfExport", () => {
  const csv = baueExtfExport(
    [BUCHUNG],
    { von: "2025-01-01", bis: "2025-12-31" },
    { name: "ALFA CAMPUS", datev_berater_nr: 1234567, datev_mandant_nr: 70 },
    "20260626120000000"
  )
  const zeilen = csv.split("\r\n")

  it("EXTF-Header + Berater/Mandant", () => {
    expect(zeilen[0]).toContain('"EXTF";700;21;"Buchungsstapel"')
    const f = zeilen[0].split(";")
    expect(f[11]).toBe("1234567")
    expect(f[12]).toBe("70")
    expect(f[13]).toBe("20250101") // WJ-Beginn aus von
  })
  it("Datenzeile mit Betrag + Konto", () => {
    expect(zeilen[2]).toContain("119,00")
    expect(zeilen[2]).toContain('"4240"')
    expect(zeilen[2]).toContain('"WIMUS-abcd1234"')
  })
})
