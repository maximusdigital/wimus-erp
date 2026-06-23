import { describe, expect, it } from "vitest"

import { kontaktInsertSchema } from "@/lib/validations/kontakt"
import { ANREDEN } from "@/types/kontakt"

// Phase 1 – Core Immobilien: Kontakt-Validierung + Anrede-Konformität (DS 40)
describe("kontaktInsertSchema", () => {
  const valid = { typ: "mieter" as const, dsgvo_datenweitergabe: "ja" as const }

  it("akzeptiert gültigen Kontakttyp", () => {
    const r = kontaktInsertSchema.parse({ ...valid, nachname: "Moser" })
    expect(r.typ).toBe("mieter")
    expect(r.nachname).toBe("Moser")
  })

  it("ungültiger Kontakttyp wird abgelehnt", () => {
    expect(
      kontaktInsertSchema.safeParse({ ...valid, typ: "alien" }).success
    ).toBe(false)
  })

  it("DSGVO-Datenweitergabe wird zu boolean transformiert", () => {
    expect(
      kontaktInsertSchema.parse({ ...valid, dsgvo_datenweitergabe: "ja" })
        .dsgvo_datenweitergabe
    ).toBe(true)
    expect(
      kontaktInsertSchema.parse({ ...valid, dsgvo_datenweitergabe: "nein" })
        .dsgvo_datenweitergabe
    ).toBe(false)
    expect(
      kontaktInsertSchema.parse({ ...valid, dsgvo_datenweitergabe: true })
        .dsgvo_datenweitergabe
    ).toBe(true)
  })

  it("ungültige E-Mail wird abgelehnt, gültige akzeptiert", () => {
    expect(
      kontaktInsertSchema.safeParse({ ...valid, email: "keine-mail" }).success
    ).toBe(false)
    expect(
      kontaktInsertSchema.parse({ ...valid, email: "info@wimus.de" }).email
    ).toBe("info@wimus.de")
  })

  it("leere E-Mail -> null (kein Fehler)", () => {
    expect(kontaktInsertSchema.parse({ ...valid, email: "" }).email).toBeNull()
  })
})

// Design System 40, Pflichtregel #8: Anrede nur Herr/Frau/Firma/Keine
describe("ANREDEN (Konformität DS 40)", () => {
  it("enthält genau Herr/Frau/Firma/Keine", () => {
    expect([...ANREDEN]).toEqual(["Herr", "Frau", "Firma", "Keine"])
  })

  it("kein 'Divers' mehr", () => {
    expect(ANREDEN).not.toContain("Divers")
  })
})
