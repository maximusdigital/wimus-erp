import { describe, expect, it } from "vitest"

import {
  istMahnfaehig,
  mahnlauf,
  naechsteMahnung,
  tageUeberfaellig,
} from "@/lib/utils/mahnlauf"

const HEUTE = "2026-06-26"

// Spec 0001 / 30_prozesse Kap. 3 – Mahnlauf (Forderung → Mahnstufe)
describe("istMahnfaehig", () => {
  const basis = { id: "f", betrag: 500, faellig_am: "2026-06-01", status: "offen" }

  it("überfällig + offen + Karenz überschritten → ja", () => {
    expect(istMahnfaehig(basis, HEUTE)).toBe(true)
  })
  it("bezahlt → nein", () => {
    expect(istMahnfaehig({ ...basis, status: "bezahlt" }, HEUTE)).toBe(false)
  })
  it("voll bezahlt (Restbetrag 0) → nein", () => {
    expect(istMahnfaehig({ ...basis, bezahlt_betrag: 500 }, HEUTE)).toBe(false)
  })
  it("innerhalb Karenz (≤3 Tage) → nein", () => {
    expect(istMahnfaehig({ ...basis, faellig_am: "2026-06-24" }, HEUTE)).toBe(false)
  })
  it("Stufe 5 erreicht → nein", () => {
    expect(istMahnfaehig({ ...basis, mahnstufe: 5 }, HEUTE)).toBe(false)
  })
})

describe("naechsteMahnung", () => {
  it("Stufe hochzählen + Zinsen taggenau + Gebühren", () => {
    const v = naechsteMahnung(
      { id: "f", betrag: 500, faellig_am: "2026-06-01", status: "offen", mahnstufe: 1 },
      HEUTE
    )
    expect(v.stufe).toBe(2)
    expect(v.hauptforderung).toBe(500)
    expect(v.gebuehren).toBe(5) // Stufe 2
    expect(v.zinsen).toBeGreaterThan(0)
    expect(v.gesamt).toBe(v.hauptforderung + v.zinsen + v.gebuehren)
  })
  it("offener Restbetrag (nach Teilzahlung) ist die Hauptforderung", () => {
    const v = naechsteMahnung(
      { id: "f", betrag: 500, bezahlt_betrag: 200, faellig_am: "2026-06-01", status: "offen" },
      HEUTE
    )
    expect(v.hauptforderung).toBe(300)
  })
})

describe("mahnlauf", () => {
  it("liefert nur mahnfähige Forderungen mit Vorschlag", () => {
    const r = mahnlauf(
      [
        { id: "a", betrag: 500, faellig_am: "2026-06-01", status: "offen" },
        { id: "b", betrag: 500, faellig_am: "2026-06-01", status: "bezahlt" },
        { id: "c", betrag: 500, faellig_am: "2026-06-25", status: "offen" }, // Karenz
      ],
      HEUTE
    )
    expect(r.map((v) => v.forderung_id)).toEqual(["a"])
  })
})

describe("tageUeberfaellig", () => {
  it("positiv wenn überfällig", () => {
    expect(tageUeberfaellig("2026-06-01", HEUTE)).toBe(25)
  })
})
