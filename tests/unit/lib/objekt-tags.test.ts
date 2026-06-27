import { describe, expect, it } from "vitest"

import {
  gruppiereNachTag,
  tagWerte,
  OHNE_TAG,
  tagDimensionLabel,
  type ObjektTag,
} from "@/lib/fibu/objekt-tags"

type Obj = { id: string; tags: ObjektTag[] }

const objekte: Obj[] = [
  { id: "BHS16", tags: [{ tag_typ: "nutzungsart", wert: "Wohnen" }, { tag_typ: "marke", wert: "ALFA CAMPUS" }] },
  { id: "AS125", tags: [{ tag_typ: "nutzungsart", wert: "Wohnen" }, { tag_typ: "nutzungsart", wert: "Gewerbe" }] },
  { id: "BS21A", tags: [{ tag_typ: "marke", wert: "WIMUS" }] },
  { id: "MS13", tags: [] },
]

describe("gruppiereNachTag", () => {
  it("gruppiert nach Nutzungsart; Mehrfach-Tag erscheint in mehreren Gruppen", () => {
    const g = gruppiereNachTag(objekte, "nutzungsart")
    const gewerbe = g.find((x) => x.wert === "Gewerbe")!
    const wohnen = g.find((x) => x.wert === "Wohnen")!
    expect(wohnen.objekte.map((o) => o.id).sort()).toEqual(["AS125", "BHS16"])
    expect(gewerbe.objekte.map((o) => o.id)).toEqual(["AS125"]) // AS125 in beiden
  })

  it("Objekte ohne passenden Tag landen in (ohne), das immer ans Ende sortiert", () => {
    const g = gruppiereNachTag(objekte, "nutzungsart")
    expect(g[g.length - 1].wert).toBe(OHNE_TAG)
    expect(g[g.length - 1].objekte.map((o) => o.id)).toEqual(["BS21A", "MS13"])
  })

  it("Gruppen alphabetisch sortiert (vor (ohne))", () => {
    const g = gruppiereNachTag(objekte, "nutzungsart")
    expect(g.map((x) => x.wert)).toEqual(["Gewerbe", "Wohnen", OHNE_TAG])
  })

  it("tagWerte: distinkte sortierte Werte einer Dimension", () => {
    expect(tagWerte(objekte, "marke")).toEqual(["ALFA CAMPUS", "WIMUS"])
  })

  it("tagDimensionLabel", () => {
    expect(tagDimensionLabel("region")).toBe("Region")
    expect(tagDimensionLabel("unbekannt")).toBe("unbekannt")
  })
})
