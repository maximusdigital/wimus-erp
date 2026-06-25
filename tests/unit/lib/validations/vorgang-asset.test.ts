import { describe, expect, it } from "vitest"

import { assetInsertSchema } from "@/lib/validations/asset"
import { vorgangInsertSchema } from "@/lib/validations/vorgang"

const UUID = "11111111-1111-4111-8111-111111111111"

// Phase 4 – Vorgänge (P14) – wimus-Schema (kein freies Titel-Feld mehr)
describe("vorgangInsertSchema", () => {
  const valid = { prioritaet: "hoch" as const, status: "offen" as const }

  it("Priorität als Enum (gültig/ungültig)", () => {
    expect(vorgangInsertSchema.parse({ ...valid, prioritaet: "kritisch" }).prioritaet).toBe(
      "kritisch"
    )
    expect(
      vorgangInsertSchema.safeParse({ ...valid, prioritaet: "egal" }).success
    ).toBe(false)
  })

  it("Status als Enum (gültig/ungültig)", () => {
    expect(vorgangInsertSchema.parse({ ...valid, status: "erledigt" }).status).toBe(
      "erledigt"
    )
    expect(
      vorgangInsertSchema.safeParse({ ...valid, status: "irgendwas" }).success
    ).toBe(false)
  })

  it("Typ + Kostenträger: leer -> null, ungültig -> Fehler", () => {
    expect(vorgangInsertSchema.parse({ ...valid, typ: "" }).typ).toBeNull()
    expect(vorgangInsertSchema.parse({ ...valid, typ: "schaden" }).typ).toBe("schaden")
    expect(
      vorgangInsertSchema.safeParse({ ...valid, kostentraeger: "papst" }).success
    ).toBe(false)
  })

  it("massnahme_typ: leer -> null, gültig/ungültig", () => {
    expect(vorgangInsertSchema.parse({ ...valid, massnahme_typ: "" }).massnahme_typ).toBeNull()
    expect(
      vorgangInsertSchema.parse({ ...valid, massnahme_typ: "wartung" }).massnahme_typ
    ).toBe("wartung")
    expect(
      vorgangInsertSchema.safeParse({ ...valid, massnahme_typ: "blah" }).success
    ).toBe(false)
  })

  it("Kosten: leer -> null, Zahl wird geparst", () => {
    expect(vorgangInsertSchema.parse({ ...valid, kosten_geschaetzt: "" }).kosten_geschaetzt).toBeNull()
    expect(
      vorgangInsertSchema.parse({ ...valid, kosten_ist: "1234,50" }).kosten_ist
    ).toBe(1234.5)
  })

  it("objekt_id/einheit_id/handwerker_id als optionale UUID", () => {
    expect(vorgangInsertSchema.parse({ ...valid, objekt_id: UUID }).objekt_id).toBe(UUID)
    expect(
      vorgangInsertSchema.parse({ ...valid, handwerker_id: UUID }).handwerker_id
    ).toBe(UUID)
    expect(
      vorgangInsertSchema.safeParse({ ...valid, einheit_id: "nope" }).success
    ).toBe(false)
  })
})

// Phase 4 – Asset-Register / Inventar
describe("assetInsertSchema", () => {
  const valid = { bezeichnung: "Bohrmaschine" }

  it("Bezeichnung ist Pflicht und wird getrimmt", () => {
    expect(assetInsertSchema.parse({ bezeichnung: "  Akkuschrauber " }).bezeichnung).toBe(
      "Akkuschrauber"
    )
    expect(assetInsertSchema.safeParse({ bezeichnung: "" }).success).toBe(false)
  })

  it("Typ/Zustand/Standort als Enum geprüft", () => {
    const r = assetInsertSchema.parse({
      ...valid,
      typ: "werkzeug",
      zustand: "gut",
      standort_typ: "lager",
    })
    expect(r.typ).toBe("werkzeug")
    expect(r.zustand).toBe("gut")
    expect(r.standort_typ).toBe("lager")
    expect(
      assetInsertSchema.safeParse({ ...valid, zustand: "kaputt-ish" }).success
    ).toBe(false)
  })

  it("asset_code leer -> null", () => {
    expect(assetInsertSchema.parse({ ...valid, asset_code: "  " }).asset_code).toBeNull()
  })
})
