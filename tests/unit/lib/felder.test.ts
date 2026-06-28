import { describe, it, expect } from "vitest"

import { slugifyKey, uniqueKey } from "@/lib/felder/key"
import {
  wertSpalte,
  filterTypFor,
  normalisiereWert,
  istLeer,
} from "@/lib/felder/mapping"
import {
  defsToFilterFields,
  cfColumn,
  isCfColumn,
  cfKeyFromColumn,
  CF_PREFIX,
} from "@/lib/felder/filter-adapter"
import type { FieldDef } from "@/lib/felder/types"

describe("felder/key – stabiler key statt Label", () => {
  it("transliteriert Umlaute und slugged", () => {
    expect(slugifyKey("Größe in m²")).toBe("groesse_in_m2") // ² → 2 via NFKD
    expect(slugifyKey("Möbliert?")).toBe("moebliert")
    expect(slugifyKey("VIP-Status")).toBe("vip_status")
  })

  it("garantiert Buchstaben-Start und nie leer", () => {
    expect(slugifyKey("123 Nummer")).toBe("f_123_nummer")
    expect(slugifyKey("   ")).toBe("feld")
    expect(slugifyKey("€€€")).toBe("feld")
  })

  it("uniqueKey hängt deterministisch _2/_3 an", () => {
    expect(uniqueKey("Budget", [])).toBe("budget")
    expect(uniqueKey("Budget", ["budget"])).toBe("budget_2")
    expect(uniqueKey("Budget", ["budget", "budget_2"])).toBe("budget_3")
  })
})

describe("felder/mapping – Variante C Speicher + 0006-Filtertyp", () => {
  it("mappt Feldtyp → Speicherspalte", () => {
    expect(wertSpalte("text")).toBe("wert_text")
    expect(wertSpalte("auswahl")).toBe("wert_text")
    expect(wertSpalte("zahl")).toBe("wert_zahl")
    expect(wertSpalte("datum")).toBe("wert_datum")
    expect(wertSpalte("janein")).toBe("wert_bool")
    expect(wertSpalte("mehrfachauswahl")).toBe("option")
  })

  it("mappt Feldtyp → 0006-Filtertyp", () => {
    expect(filterTypFor("text")).toBe("text")
    expect(filterTypFor("zahl")).toBe("number")
    expect(filterTypFor("datum")).toBe("date")
    expect(filterTypFor("janein")).toBe("bool")
    expect(filterTypFor("auswahl")).toBe("enum")
    expect(filterTypFor("mehrfachauswahl")).toBe("enum")
  })

  it("normalisiert typgerecht", () => {
    expect(normalisiereWert("zahl", "1.234,5")).toMatchObject({ ok: false })
    expect(normalisiereWert("zahl", "1234,5")).toMatchObject({ ok: true, wert: { wert_zahl: 1234.5 } })
    expect(normalisiereWert("datum", "2026-06-28")).toMatchObject({ ok: true, wert: { wert_datum: "2026-06-28" } })
    expect(normalisiereWert("datum", "28.06.2026")).toMatchObject({ ok: false })
    expect(normalisiereWert("janein", "true")).toMatchObject({ ok: true, wert: { wert_bool: true } })
    expect(normalisiereWert("mehrfachauswahl", ["a", "b"])).toMatchObject({ ok: true, wert: { optionen: ["a", "b"] } })
  })

  it("leere Eingabe ist erlaubt (Pflicht separat)", () => {
    const r = normalisiereWert("text", "")
    expect(r.ok).toBe(true)
    if (r.ok) expect(istLeer("text", r.wert)).toBe(true)
  })

  it("istLeer je Typ", () => {
    const r = normalisiereWert("zahl", "0")
    expect(r.ok).toBe(true)
    if (r.ok) expect(istLeer("zahl", r.wert)).toBe(false) // 0 ist NICHT leer
  })
})

describe("felder/filter-adapter – 0006-Andockung", () => {
  const baseDef = (over: Partial<FieldDef>): FieldDef => ({
    id: "d1",
    mandant_id: "m1",
    entitaet: "person",
    key: "budget",
    label: "Budget",
    typ: "zahl",
    geschuetzt: false,
    pflicht: false,
    sortierung: 0,
    gruppe: null,
    aktiv: true,
    ...over,
  })

  it("cf-Spalten-Präfix ist roundtrip-fähig", () => {
    expect(cfColumn("budget")).toBe(`${CF_PREFIX}budget`)
    expect(isCfColumn(cfColumn("budget"))).toBe(true)
    expect(isCfColumn("status")).toBe(false)
    expect(cfKeyFromColumn(cfColumn("budget"))).toBe("budget")
  })

  it("erzeugt FilterFields nur für aktive Defs", () => {
    const fields = defsToFilterFields([
      baseDef({}),
      baseDef({ id: "d2", key: "inaktiv", aktiv: false }),
    ])
    expect(fields).toHaveLength(1)
    expect(fields[0]).toMatchObject({ column: "cf_budget", type: "number", label: "Budget" })
  })

  it("enum-Felder übernehmen aktive Optionen mit opt_key als value", () => {
    const fields = defsToFilterFields([
      baseDef({
        key: "stufe",
        label: "Stufe",
        typ: "auswahl",
        optionen: [
          { id: "o1", opt_key: "gold", label: "Gold", sortierung: 0, aktiv: true },
          { id: "o2", opt_key: "silber", label: "Silber", sortierung: 10, aktiv: false },
        ],
      }),
    ])
    expect(fields[0].type).toBe("enum")
    expect(fields[0].optionen).toEqual([{ value: "gold", label: "Gold" }])
  })
})
