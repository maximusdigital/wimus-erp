import { describe, expect, it } from "vitest"

import { buchungInsertSchema } from "@/lib/validations/buchung"

const UUID = "11111111-1111-4111-8111-111111111111"

// Phase 3 – KZV: Buchung-Validierung
describe("buchungInsertSchema", () => {
  const valid = { status: "bestaetigt" as const }

  it("akzeptiert gültigen Kanal, lehnt ungültigen ab", () => {
    expect(buchungInsertSchema.parse({ ...valid, kanal: "airbnb" }).kanal).toBe(
      "airbnb"
    )
    expect(
      buchungInsertSchema.safeParse({ ...valid, kanal: "fewo-direkt" }).success
    ).toBe(false)
  })

  it("personen muss ganzzahlig sein", () => {
    expect(buchungInsertSchema.parse({ ...valid, personen: "2" }).personen).toBe(2)
    expect(
      buchungInsertSchema.safeParse({ ...valid, personen: "2.5" }).success
    ).toBe(false)
  })

  it("betrag/ust dürfen dezimal sein", () => {
    const r = buchungInsertSchema.parse({ ...valid, betrag: "199.90", ust_prozent: "7" })
    expect(r.betrag).toBe(199.9)
    expect(r.ust_prozent).toBe(7)
  })

  it("einheit_id/gast_id: leer -> null, ungültig -> Fehler, UUID -> ok", () => {
    expect(buchungInsertSchema.parse({ ...valid, einheit_id: "" }).einheit_id).toBeNull()
    expect(
      buchungInsertSchema.safeParse({ ...valid, einheit_id: "x" }).success
    ).toBe(false)
    expect(buchungInsertSchema.parse({ ...valid, gast_id: UUID }).gast_id).toBe(UUID)
  })

  it("apartment_pin bleibt als Text erhalten (dynamischer PIN)", () => {
    expect(
      buchungInsertSchema.parse({ ...valid, apartment_pin: "4711" }).apartment_pin
    ).toBe("4711")
  })

  it("ungültiger Status wird abgelehnt", () => {
    expect(buchungInsertSchema.safeParse({ status: "irgendwas" }).success).toBe(false)
  })
})
