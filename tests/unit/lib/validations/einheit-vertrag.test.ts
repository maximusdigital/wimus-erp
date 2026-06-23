import { describe, expect, it } from "vitest"

import { einheitInsertSchema } from "@/lib/validations/einheit"
import { vertragInsertSchema } from "@/lib/validations/vertrag"

const UUID = "11111111-1111-4111-8111-111111111111"

// Phase 1 – Core Immobilien: Einheit-Validierung
describe("einheitInsertSchema", () => {
  it("objekt_id muss eine UUID sein (Pflichtbeziehung)", () => {
    expect(einheitInsertSchema.safeParse({ status: "frei" }).success).toBe(false)
    expect(
      einheitInsertSchema.safeParse({ objekt_id: "abc", status: "frei" }).success
    ).toBe(false)
  })

  it("verwendungszweck_code wird getrimmt und uppercased", () => {
    const r = einheitInsertSchema.parse({
      objekt_id: UUID,
      status: "frei",
      verwendungszweck_code: " bhs16w3z1 ",
    })
    expect(r.verwendungszweck_code).toBe("BHS16W3Z1")
  })

  it("akzeptiert gültigen Status, lehnt ungültigen ab", () => {
    expect(
      einheitInsertSchema.parse({ objekt_id: UUID, status: "vermietet" }).status
    ).toBe("vermietet")
    expect(
      einheitInsertSchema.safeParse({ objekt_id: UUID, status: "besetzt" }).success
    ).toBe(false)
  })
})

// Phase 1 – Core Immobilien: Vertrag-Validierung
describe("vertragInsertSchema", () => {
  const valid = { status: "aktiv" as const, unbefristet: "nein" as const }

  it("unbefristet wird zu boolean transformiert", () => {
    expect(vertragInsertSchema.parse({ ...valid, unbefristet: "ja" }).unbefristet).toBe(
      true
    )
    expect(
      vertragInsertSchema.parse({ ...valid, unbefristet: "nein" }).unbefristet
    ).toBe(false)
  })

  it("akzeptiert Vertragsarten V01–V04, lehnt andere ab", () => {
    expect(vertragInsertSchema.parse({ ...valid, vertragsart: "V03" }).vertragsart).toBe(
      "V03"
    )
    expect(
      vertragInsertSchema.safeParse({ ...valid, vertragsart: "V99" }).success
    ).toBe(false)
  })

  it("optionale FK-IDs: leer -> null, ungültig -> Fehler", () => {
    expect(vertragInsertSchema.parse({ ...valid, objekt_id: "" }).objekt_id).toBeNull()
    expect(
      vertragInsertSchema.safeParse({ ...valid, objekt_id: "nope" }).success
    ).toBe(false)
    expect(vertragInsertSchema.parse({ ...valid, mieter_id: UUID }).mieter_id).toBe(UUID)
  })

  it("Geldbeträge werden zu number, leer zu null", () => {
    const r = vertragInsertSchema.parse({ ...valid, grundmiete: "850.50", bk_pauschale: "" })
    expect(r.grundmiete).toBe(850.5)
    expect(r.bk_pauschale).toBeNull()
  })
})
