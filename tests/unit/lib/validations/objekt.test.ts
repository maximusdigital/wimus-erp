import { describe, expect, it } from "vitest"

import { objektInsertSchema } from "@/lib/validations/objekt"

// Phase 1 – Core Immobilien: Objekt-Validierung (Server-Insert)
describe("objektInsertSchema", () => {
  const valid = { kuerzel: "as125", status: "ist" as const }

  it("trimmt und uppercased das Kürzel", () => {
    const r = objektInsertSchema.parse({ ...valid, kuerzel: "  as125 " })
    expect(r.kuerzel).toBe("AS125")
  })

  it("Kürzel ist Pflicht", () => {
    expect(objektInsertSchema.safeParse({ status: "ist" }).success).toBe(false)
    expect(
      objektInsertSchema.safeParse({ kuerzel: "", status: "ist" }).success
    ).toBe(false)
  })

  it("leere optionale Strings werden zu null", () => {
    const r = objektInsertSchema.parse({ ...valid, stadt: "", strasse: "  " })
    expect(r.stadt).toBeNull()
    expect(r.strasse).toBeNull()
  })

  it("numerische Felder werden zu number, leer zu null", () => {
    const r = objektInsertSchema.parse({
      ...valid,
      baujahr: "1998",
      marktwert_sprengnetter: "",
    })
    expect(r.baujahr).toBe(1998)
    expect(r.marktwert_sprengnetter).toBeNull()
  })

  it("ungültiger Objekttyp wird abgelehnt", () => {
    expect(
      objektInsertSchema.safeParse({ ...valid, typ: "Schloss" }).success
    ).toBe(false)
  })

  it("gültiger Objekttyp + Haltestrategie werden akzeptiert", () => {
    const r = objektInsertSchema.parse({
      ...valid,
      typ: "MFH",
      haltestrategie: "bestand",
    })
    expect(r.typ).toBe("MFH")
    expect(r.haltestrategie).toBe("bestand")
  })

  it("ungültiger Status (Enum) wird abgelehnt", () => {
    expect(
      objektInsertSchema.safeParse({ ...valid, status: "vermietet" }).success
    ).toBe(false)
  })
})
