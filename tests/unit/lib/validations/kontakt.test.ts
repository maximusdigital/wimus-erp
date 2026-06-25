import { describe, expect, it } from "vitest"

import { kontaktInsertSchema } from "@/lib/validations/kontakt"
import { ANREDEN } from "@/types/kontakt"

// Cutover wimus – Kontakt-Validierung (kontakt_typ + ist_* + DSGVO).
describe("kontaktInsertSchema", () => {
  const valid = {
    kontakt_typ: "person" as const,
    dsgvo_datenweitergabe: "ja" as const,
  }

  it("akzeptiert gültigen Kontakttyp (person)", () => {
    const r = kontaktInsertSchema.parse({ ...valid, nachname: "Moser" })
    expect(r.kontakt_typ).toBe("person")
    expect(r.nachname).toBe("Moser")
  })

  it("akzeptiert kontakt_typ firma", () => {
    const r = kontaktInsertSchema.parse({
      ...valid,
      kontakt_typ: "firma",
      firmenname: "WIMUS GmbH",
    })
    expect(r.kontakt_typ).toBe("firma")
    expect(r.firmenname).toBe("WIMUS GmbH")
  })

  it("ungültiger Kontakttyp wird abgelehnt", () => {
    expect(
      kontaktInsertSchema.safeParse({ ...valid, kontakt_typ: "alien" }).success
    ).toBe(false)
  })

  it("Rollen-Flags (ist_*) werden zu boolean transformiert", () => {
    const r = kontaktInsertSchema.parse({
      ...valid,
      ist_mieter: "ja",
      ist_eigentuemer: true,
    })
    expect(r.ist_mieter).toBe(true)
    expect(r.ist_eigentuemer).toBe(true)
    // nicht gesetzt -> false
    expect(r.ist_dienstleister).toBe(false)
    expect(r.ist_makler).toBe(false)
    expect(r.ist_tippgeber).toBe(false)
    expect(r.ist_bank).toBe(false)
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

  it("aktiv default true, 'nein' -> false", () => {
    expect(kontaktInsertSchema.parse({ ...valid }).aktiv).toBe(true)
    expect(kontaktInsertSchema.parse({ ...valid, aktiv: "nein" }).aktiv).toBe(
      false
    )
  })

  it("zahlungsziel_tage wird zu int oder null", () => {
    expect(
      kontaktInsertSchema.parse({ ...valid, zahlungsziel_tage: "14" })
        .zahlungsziel_tage
    ).toBe(14)
    expect(
      kontaktInsertSchema.parse({ ...valid, zahlungsziel_tage: "" })
        .zahlungsziel_tage
    ).toBeNull()
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
