import { describe, expect, it } from "vitest"

import { entscheideAutoreply, type AutoreplyRegel } from "@/lib/kommunikation/autoreply"

const regelImmer: AutoreplyRegel = {
  id: "r1",
  aktiv: true,
  bedingung_typ: "immer",
  antwort_text: "Danke, wir melden uns.",
}

const trigger = (over: Partial<Parameters<typeof entscheideAutoreply>[1]> = {}) => ({
  text: "Hallo",
  zeitpunkt: new Date("2026-06-29T03:00:00"), // Mo 03:00 (GZ irrelevant für diese Fälle)
  istAutoreply: false,
  letzterAutoreplyAm: null,
  ...over,
})

describe("kommunikation/autoreply", () => {
  it("antwortet bei Regel 'immer'", () => {
    const e = entscheideAutoreply([regelImmer], trigger())
    expect(e).toEqual({ antworten: true, regelId: "r1", antwortText: "Danke, wir melden uns." })
  })

  it("antwortet NIE auf Autoreply (Anti-Schleife)", () => {
    expect(entscheideAutoreply([regelImmer], trigger({ istAutoreply: true })).antworten).toBe(false)
  })

  it("blockt zweiten Autoreply im Fenster", () => {
    const e = entscheideAutoreply(
      [regelImmer],
      trigger({ zeitpunkt: new Date("2026-06-29T03:30:00"), letzterAutoreplyAm: new Date("2026-06-29T03:00:00") }),
    )
    expect(e.antworten).toBe(false)
  })

  it("erlaubt Autoreply nach Ablauf des Fensters", () => {
    const e = entscheideAutoreply(
      [regelImmer],
      trigger({ zeitpunkt: new Date("2026-06-29T05:00:00"), letzterAutoreplyAm: new Date("2026-06-29T03:00:00") }),
    )
    expect(e.antworten).toBe(true)
  })

  it("stichwort: nur bei Treffer", () => {
    const r: AutoreplyRegel = {
      id: "r2",
      aktiv: true,
      bedingung_typ: "stichwort",
      bedingung_wert: { stichworte: ["rechnung", "beleg"] },
      antwort_text: "Beleg erhalten.",
    }
    expect(entscheideAutoreply([r], trigger({ text: "Hier die RECHNUNG" })).antworten).toBe(true)
    expect(entscheideAutoreply([r], trigger({ text: "Nur Hallo" })).antworten).toBe(false)
  })

  it("ausser_geschaeftszeiten: nachts ja, werktags mittags nein", () => {
    const r: AutoreplyRegel = {
      id: "r3",
      aktiv: true,
      bedingung_typ: "ausser_geschaeftszeiten",
      antwort_text: "Außerhalb der Geschäftszeiten.",
    }
    // Mo 12:00 = innerhalb GZ → keine Antwort
    expect(entscheideAutoreply([r], trigger({ zeitpunkt: new Date("2026-06-29T12:00:00") })).antworten).toBe(false)
    // So 03:00 = außerhalb → Antwort
    expect(entscheideAutoreply([r], trigger({ zeitpunkt: new Date("2026-06-28T03:00:00") })).antworten).toBe(true)
  })

  it("inaktive Regeln werden übersprungen", () => {
    expect(entscheideAutoreply([{ ...regelImmer, aktiv: false }], trigger()).antworten).toBe(false)
  })
})
