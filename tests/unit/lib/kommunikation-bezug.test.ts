import { describe, expect, it } from "vitest"

import { leiteBezuege } from "@/lib/kommunikation/bezug"

describe("kommunikation/bezug", () => {
  it("Einzelkontakt ohne Immobilienbezug → nur Kontakt-Basis", () => {
    const b = leiteBezuege({ kontakte: [{ kontakt_id: "k1" }] })
    expect(b).toEqual([{ bezug_typ: "kontakt", bezug_id: "k1", quelle: "adressiert" }])
  })

  it("Mieter → Kontakt + mieter + abgeleitet Einheit/Objekt", () => {
    const b = leiteBezuege({
      kontakte: [{ kontakt_id: "k1", einheit_id: "e1", objekt_id: "o1", ist_mieter: true }],
    })
    expect(b).toContainEqual({ bezug_typ: "kontakt", bezug_id: "k1", quelle: "adressiert" })
    expect(b).toContainEqual({ bezug_typ: "mieter", bezug_id: "k1", quelle: "adressiert" })
    expect(b).toContainEqual({ bezug_typ: "einheit", bezug_id: "e1", quelle: "abgeleitet" })
    expect(b).toContainEqual({ bezug_typ: "objekt", bezug_id: "o1", quelle: "abgeleitet" })
  })

  it("WG-Sammel: Einheit adressiert schlägt abgeleitet", () => {
    const b = leiteBezuege({
      kontakte: [
        { kontakt_id: "k1", einheit_id: "e1", objekt_id: "o1", ist_mieter: true },
        { kontakt_id: "k2", einheit_id: "e1", objekt_id: "o1", ist_mieter: true },
      ],
      einheitAdressiert: { einheit_id: "e1", objekt_id: "o1" },
    })
    // Einheit e1 nur EINMAL, und als adressiert (nicht abgeleitet)
    const einheitEintraege = b.filter((x) => x.bezug_typ === "einheit")
    expect(einheitEintraege).toHaveLength(1)
    expect(einheitEintraege[0].quelle).toBe("adressiert")
    expect(b).toContainEqual({ bezug_typ: "wg", bezug_id: "e1", quelle: "adressiert" })
    expect(b).toContainEqual({ bezug_typ: "kontakt", bezug_id: "k1", quelle: "adressiert" })
    expect(b).toContainEqual({ bezug_typ: "kontakt", bezug_id: "k2", quelle: "adressiert" })
  })

  it("Vorgangsbezug wird ergänzt", () => {
    const b = leiteBezuege({ kontakte: [{ kontakt_id: "k1" }], vorgang_id: "v1" })
    expect(b).toContainEqual({ bezug_typ: "vorgang", bezug_id: "v1", quelle: "adressiert" })
  })

  it("dedupliziert pro (typ,id)", () => {
    const b = leiteBezuege({
      kontakte: [{ kontakt_id: "k1" }, { kontakt_id: "k1" }],
    })
    expect(b.filter((x) => x.bezug_typ === "kontakt")).toHaveLength(1)
  })
})
