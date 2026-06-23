import { describe, expect, it } from "vitest"

import { kautionInsertSchema } from "@/lib/validations/kaution"
import { mahnungInsertSchema } from "@/lib/validations/mahnung"

// Phase 2 – Finanzen: Mahnung-Validierung
describe("mahnungInsertSchema", () => {
  it("Stufe wird auf 1..5 begrenzt (Default 1)", () => {
    expect(mahnungInsertSchema.parse({ status: "offen" }).stufe).toBe(1)
    expect(mahnungInsertSchema.parse({ status: "offen", stufe: "3" }).stufe).toBe(3)
    expect(mahnungInsertSchema.parse({ status: "offen", stufe: 5 }).stufe).toBe(5)
  })

  it("Stufe außerhalb 1..5 wird abgelehnt", () => {
    expect(
      mahnungInsertSchema.safeParse({ status: "offen", stufe: 6 }).success
    ).toBe(false)
    expect(
      mahnungInsertSchema.safeParse({ status: "offen", stufe: 0 }).success
    ).toBe(false)
  })

  it("Beträge: leer -> null, Zahl -> number", () => {
    const r = mahnungInsertSchema.parse({
      status: "offen",
      hauptforderung: "500",
      zinsen: "",
    })
    expect(r.hauptforderung).toBe(500)
    expect(r.zinsen).toBeNull()
  })

  it("ungültiger Status wird abgelehnt", () => {
    expect(mahnungInsertSchema.safeParse({ status: "egal" }).success).toBe(false)
  })
})

// Phase 2 – Finanzen: Kaution-Validierung
describe("kautionInsertSchema", () => {
  it("akzeptiert gültigen Status + Anlageart", () => {
    const r = kautionInsertSchema.parse({
      status: "hinterlegt",
      anlage_art: "mietkautionskonto",
      betrag: "2400",
    })
    expect(r.status).toBe("hinterlegt")
    expect(r.anlage_art).toBe("mietkautionskonto")
    expect(r.betrag).toBe(2400)
  })

  it("ungültige Anlageart wird abgelehnt", () => {
    expect(
      kautionInsertSchema.safeParse({ status: "angelegt", anlage_art: "krypto" })
        .success
    ).toBe(false)
  })

  it("ungültiger Status wird abgelehnt", () => {
    expect(kautionInsertSchema.safeParse({ status: "weg" }).success).toBe(false)
  })
})
