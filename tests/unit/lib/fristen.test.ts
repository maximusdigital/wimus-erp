import { describe, expect, it } from "vitest"

import {
  erinnerungFaellig,
  fristAmpel,
  tageBisFaellig,
} from "@/lib/utils/fristen"
import { fristInsertSchema } from "@/lib/validations/frist"

const HEUTE = "2026-06-25"

// Spec 0001 / 30_prozesse Kap. 2 – Fristenmanagement
describe("tageBisFaellig", () => {
  it("zukünftig positiv, vergangen negativ", () => {
    expect(tageBisFaellig("2026-07-05", HEUTE)).toBe(10)
    expect(tageBisFaellig("2026-06-20", HEUTE)).toBe(-5)
  })
  it("kein/ungültiges Datum → null", () => {
    expect(tageBisFaellig(null, HEUTE)).toBeNull()
  })
})

describe("fristAmpel", () => {
  it("erledigt → erledigt", () => {
    expect(fristAmpel("2026-07-30", HEUTE, "erledigt")).toBe("erledigt")
  })
  it("überfällig/≤7 Tage → rot", () => {
    expect(fristAmpel("2026-06-20", HEUTE)).toBe("rot")
    expect(fristAmpel("2026-06-30", HEUTE)).toBe("rot")
  })
  it("≤30 Tage → gelb", () => {
    expect(fristAmpel("2026-07-20", HEUTE)).toBe("gelb")
  })
  it("> 30 Tage → grün", () => {
    expect(fristAmpel("2026-09-01", HEUTE)).toBe("gruen")
  })
})

describe("erinnerungFaellig", () => {
  it("trifft, wenn verbleibende Tage in der Liste sind", () => {
    expect(erinnerungFaellig("2026-07-09", [30, 14, 7, 1], HEUTE)).toBe(true) // 14 Tage
    expect(erinnerungFaellig("2026-07-05", [30, 14, 7, 1], HEUTE)).toBe(false) // 10 Tage
  })
  it("ohne Liste/Datum → false", () => {
    expect(erinnerungFaellig("2026-07-09", null, HEUTE)).toBe(false)
  })
})

describe("fristInsertSchema", () => {
  it("erinnerung_tage_vorher: '30, 14, 7, 1' → Array", () => {
    const r = fristInsertSchema.parse({
      frist_typ: "wartung_rauchmelder",
      faellig_am: "2026-12-01",
      erinnerung_tage_vorher: "30, 14, 7, 1",
      status: "offen",
    })
    expect(r.erinnerung_tage_vorher).toEqual([30, 14, 7, 1])
  })
  it("ungültiger frist_typ wird abgelehnt", () => {
    expect(
      fristInsertSchema.safeParse({ frist_typ: "blah", faellig_am: "2026-01-01", status: "offen" })
        .success
    ).toBe(false)
  })
})
