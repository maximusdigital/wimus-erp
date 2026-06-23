import { describe, expect, it } from "vitest"

import {
  buildVerwendungszweck,
  formatVerwendungszweck,
  parseVerwendungszweck,
} from "@/lib/utils/verwendungszweck"

// Phase 3 – KZV: Verwendungszweck-Parser ({KÜRZEL}W{WOHNUNG}Z{ZIMMER})
describe("parseVerwendungszweck", () => {
  it("BHS16W3Z1 -> Kürzel BHS16, Wohnung 3, Zimmer 1", () => {
    expect(parseVerwendungszweck("BHS16W3Z1")).toEqual({
      objektKuerzel: "BHS16",
      wohnung: 3,
      zimmer: 1,
    })
  })

  it("AS125W2Z2 -> Kürzel AS125, Wohnung 2, Zimmer 2", () => {
    expect(parseVerwendungszweck("AS125W2Z2")).toEqual({
      objektKuerzel: "AS125",
      wohnung: 2,
      zimmer: 2,
    })
  })

  it("BS21A (EFH, keine Unterteilung) -> nur Kürzel", () => {
    expect(parseVerwendungszweck("BS21A")).toEqual({
      objektKuerzel: "BS21A",
      wohnung: null,
      zimmer: null,
    })
  })

  it("trimmt und uppercased die Eingabe", () => {
    expect(parseVerwendungszweck("  bhs16w3z1 ")?.objektKuerzel).toBe("BHS16")
  })

  it("leere Eingabe -> null", () => {
    expect(parseVerwendungszweck("")).toBeNull()
  })
})

describe("buildVerwendungszweck", () => {
  it("baut Code aus Bestandteilen", () => {
    expect(buildVerwendungszweck("BHS16", 3, 1)).toBe("BHS16W3Z1")
    expect(buildVerwendungszweck("BS21A")).toBe("BS21A")
    expect(buildVerwendungszweck("as125", 2)).toBe("AS125W2")
  })

  it("Roundtrip parse -> build", () => {
    const code = "BHS16W3Z1"
    const p = parseVerwendungszweck(code)!
    expect(buildVerwendungszweck(p.objektKuerzel, p.wohnung, p.zimmer)).toBe(code)
  })
})

describe("formatVerwendungszweck", () => {
  it("liefert menschenlesbare Beschreibung", () => {
    expect(formatVerwendungszweck("BHS16W3Z1")).toBe("BHS16 · Wohnung 3 · Zimmer 1")
    expect(formatVerwendungszweck("BS21A")).toBe("BS21A")
  })
})
