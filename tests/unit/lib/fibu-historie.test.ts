import { describe, it, expect, vi, beforeEach } from "vitest"

// protokolliere + K1-Resolver mocken → wir prüfen NUR die Emitter-Verdrahtung
// (typ/modul/primaerBezug/payload) und das Nicht-Blockieren.
vi.mock("@/lib/historie/protokolliere", () => ({
  protokolliere: vi.fn(async () => ({ ok: true, id: "akt-1" })),
}))
vi.mock("@/lib/fibu/k1-bezug", () => ({
  resolveK1Bezug: vi.fn(async () => ({ primaer: { typ: "objekt", id: "obj-1" } })),
}))

import { protokolliere } from "@/lib/historie/protokolliere"
import { resolveK1Bezug } from "@/lib/fibu/k1-bezug"
import {
  protokolliereBelegVerbucht,
  protokolliereMahnungVersandt,
  protokolliereZahlungEingegangen,
} from "@/lib/fibu/historie"

const client = {} as unknown
const MANDANT = "m-1"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("protokolliereZahlungEingegangen", () => {
  it("ruft protokolliere mit typ/modul und Mietvertrag als Primär-Bezug", async () => {
    await protokolliereZahlungEingegangen(client, MANDANT, {
      mietvertragId: "mv-1",
      einheitId: "e-1",
      objektId: "o-1",
      betrag: 850,
      datum: "2026-06-01",
      forderungId: "f-1",
      quelle: "bank",
      akteurId: "u-1",
    })
    expect(protokolliere).toHaveBeenCalledTimes(1)
    const [c, mandant, input] = vi.mocked(protokolliere).mock.calls[0]
    expect(c).toBe(client)
    expect(mandant).toBe(MANDANT)
    expect(input.typ).toBe("zahlung_eingegangen")
    expect(input.modul).toBe("fibu")
    expect(input.primaerBezug).toEqual({ typ: "mietvertrag", id: "mv-1" })
    expect(input.hierarchie).toEqual({ einheit_id: "e-1", objekt_id: "o-1" })
    expect(input.payload).toMatchObject({ quelle: "bank", forderung_id: "f-1", betrag: 850 })
    expect(input.akteurId).toBe("u-1")
  })

  it("ohne Mietvertrag → kein Primär-Bezug (nur Mandant)", async () => {
    await protokolliereZahlungEingegangen(client, MANDANT, {
      betrag: 100,
      quelle: "manuell",
    })
    const [, , input] = vi.mocked(protokolliere).mock.calls[0]
    expect(input.primaerBezug).toBeUndefined()
    expect(input.payload).toMatchObject({ quelle: "manuell" })
  })
})

describe("protokolliereMahnungVersandt", () => {
  it("ruft protokolliere mit mahnung_versandt + Mietvertrag-Bezug + Stufe", async () => {
    await protokolliereMahnungVersandt(client, MANDANT, {
      mietvertragId: "mv-2",
      mahnstufe: 2,
      betrag: 912.5,
      forderungId: "f-2",
      akteurId: "u-2",
    })
    expect(protokolliere).toHaveBeenCalledTimes(1)
    const [, , input] = vi.mocked(protokolliere).mock.calls[0]
    expect(input.typ).toBe("mahnung_versandt")
    expect(input.modul).toBe("fibu")
    expect(input.primaerBezug).toEqual({ typ: "mietvertrag", id: "mv-2" })
    expect(input.payload).toMatchObject({ mahnstufe: 2, forderung_id: "f-2", betrag: 912.5 })
  })
})

describe("protokolliereBelegVerbucht", () => {
  it("löst K1 auf und nutzt den aufgelösten Bezug als Primär-Bezug", async () => {
    await protokolliereBelegVerbucht(client, MANDANT, {
      belegId: "bel-1",
      betrag: 119,
      konto: "4250",
      art: "ki",
      k1: "AS125",
      akteurId: "u-3",
    })
    expect(resolveK1Bezug).toHaveBeenCalledWith(client, MANDANT, "AS125")
    const [, , input] = vi.mocked(protokolliere).mock.calls[0]
    expect(input.typ).toBe("beleg_verbucht")
    expect(input.modul).toBe("fibu")
    expect(input.primaerBezug).toEqual({ typ: "objekt", id: "obj-1" })
    expect(input.payload).toMatchObject({ beleg_id: "bel-1", konto: "4250", art: "ki" })
  })

  it("ohne K1-Treffer → kein Primär-Bezug (nur Mandant)", async () => {
    vi.mocked(resolveK1Bezug).mockResolvedValueOnce({})
    await protokolliereBelegVerbucht(client, MANDANT, {
      belegId: "bel-2",
      art: "mensch",
      k1: null,
    })
    const [, , input] = vi.mocked(protokolliere).mock.calls[0]
    expect(input.primaerBezug).toBeUndefined()
  })
})

describe("nicht-blockierend", () => {
  it("ein Fehler aus protokolliere bricht den FiBu-Vorgang NICHT ab", async () => {
    vi.mocked(protokolliere).mockRejectedValueOnce(new Error("DB weg"))
    await expect(
      protokolliereZahlungEingegangen(client, MANDANT, { mietvertragId: "mv-x", betrag: 1, quelle: "bank" }),
    ).resolves.toBeUndefined()
  })

  it("ein Fehler aus resolveK1Bezug bricht beleg_verbucht NICHT ab", async () => {
    vi.mocked(resolveK1Bezug).mockRejectedValueOnce(new Error("lookup weg"))
    await expect(
      protokolliereBelegVerbucht(client, MANDANT, { belegId: "bel-x", art: "ki", k1: "X" }),
    ).resolves.toBeUndefined()
  })
})
