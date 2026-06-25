import { describe, expect, it } from "vitest"

import { readIdList } from "@/lib/relations"
import { buildVertragOptionen } from "@/lib/vertrag-zuordnung"

// Phase 1 – bidirektionale Beziehungen
describe("readIdList", () => {
  it("fehlender Schlüssel -> null (Beziehung nicht anfassen)", () => {
    expect(readIdList({}, "einheit_ids")).toBeNull()
    expect(readIdList(null, "einheit_ids")).toBeNull()
  })

  it("Array -> dedupliziert, nur Strings", () => {
    expect(readIdList({ ids: ["a", "a", "b"] }, "ids")).toEqual(["a", "b"])
  })

  it("filtert Nicht-Strings heraus", () => {
    expect(readIdList({ ids: ["a", 1, null, "b", undefined] }, "ids")).toEqual([
      "a",
      "b",
    ])
  })

  it("leeres Array -> leeres Array (Beziehung leeren)", () => {
    expect(readIdList({ ids: [] }, "ids")).toEqual([])
  })
})

describe("buildVertragOptionen", () => {
  const vertraege = [
    { id: "v1", label: "MV-001", einheit_id: "e1", mieter_id: null },
    { id: "v2", label: "MV-002", einheit_id: "e2", mieter_id: null },
    { id: "v3", label: "MV-003", einheit_id: null, mieter_id: null },
  ]

  it("selectedIds = Verträge, die der Entität bereits zugeordnet sind", () => {
    const { selectedIds } = buildVertragOptionen(vertraege, "einheit_id", "e1")
    expect(selectedIds).toEqual(["v1"])
  })

  it("markiert fremd zugeordnete Verträge mit Hinweis", () => {
    const { options } = buildVertragOptionen(vertraege, "einheit_id", "e1")
    expect(options.find((o) => o.value === "v2")?.hint).toBe("bereits zugeordnet")
    expect(options.find((o) => o.value === "v1")?.hint).toBeUndefined()
    expect(options.find((o) => o.value === "v3")?.hint).toBeUndefined()
  })

  it("ohne entityId keine Vorauswahl", () => {
    expect(buildVertragOptionen(vertraege, "einheit_id").selectedIds).toEqual([])
  })
})
