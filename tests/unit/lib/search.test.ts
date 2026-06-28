import { describe, expect, it } from "vitest"

import { buildQueryOps, escapeOr } from "@/lib/search/query-builder"
import { mergeAndRank } from "@/lib/search/global-search"
import { getEntity } from "@/lib/search/registry"
import type { SearchEntity, SearchResult } from "@/lib/search/types"

const vorgaenge = getEntity("vorgaenge") as SearchEntity

describe("escapeOr", () => {
  it("entfernt Or-Sonderzeichen", () => {
    expect(escapeOr("a,b%(c)")).toBe("a b c")
    expect(escapeOr("  müller  ")).toBe("müller")
  })
})

describe("buildQueryOps", () => {
  it("Freitext → orIlike über trigramFields", () => {
    const ops = buildQueryOps(getEntity("kontakte")!, { suchtext: "müller" })
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      kind: "orIlike",
      expr: "nachname.ilike.%müller%,vorname.ilike.%müller%,firmenname.ilike.%müller%,email.ilike.%müller%",
    })
  })

  it("Filter-Chips je Typ → passende Ops (UND-verknüpft)", () => {
    const ops = buildQueryOps(vorgaenge, {
      suchtext: "heizung",
      filter: {
        status: { op: "in", values: ["offen", "in_arbeit"] },
        leistungsdatum: { op: "gte", value: "2026-01-01" },
      },
    })
    expect(ops).toContainEqual({ kind: "orIlike", expr: "aktenzeichen.ilike.%heizung%" })
    expect(ops).toContainEqual({ kind: "in", column: "status", values: ["offen", "in_arbeit"] })
    expect(ops).toContainEqual({ kind: "gte", column: "leistungsdatum", value: "2026-01-01" })
  })

  it("leerer Suchtext → keine orIlike-Op", () => {
    const ops = buildQueryOps(vorgaenge, { suchtext: "   " })
    expect(ops).toHaveLength(0)
  })

  it("leere in-Liste wird verworfen", () => {
    const ops = buildQueryOps(vorgaenge, { filter: { status: { op: "in", values: [] } } })
    expect(ops).toHaveLength(0)
  })
})

describe("mergeAndRank", () => {
  const r = (key: string, id: string, score: number): SearchResult => ({
    entityKey: key, entityLabel: key, id, title: id, route: `/${key}/${id}`, score,
  })
  it("sortiert nach Score absteigend und kappt aufs Limit", () => {
    const merged = mergeAndRank(
      [[r("a", "1", 0.7), r("a", "2", 1.4)], [r("b", "3", 0.9)]],
      2
    )
    expect(merged.map((x) => x.id)).toEqual(["2", "3"])
  })
})
