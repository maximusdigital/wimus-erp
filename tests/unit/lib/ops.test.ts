import { describe, expect, it } from "vitest"

import {
  istAbgeschlossen,
  statusUebergang,
  uebergangErlaubt,
} from "@/lib/ops/status"
import {
  schwereAusBetrag,
  abwicklungsstufeAusBetrag,
  schadenEinstufung,
} from "@/lib/ops/schaden"
import {
  eskalationsGrund,
  eskalationFaellig,
  istUeberfaellig,
  zeigtEskalation,
} from "@/lib/ops/eskalation"

describe("Vorgang Status-Flow", () => {
  it("erlaubte Übergänge", () => {
    expect(uebergangErlaubt("offen", "zugewiesen")).toBe(true)
    expect(uebergangErlaubt("in_arbeit", "erledigt")).toBe(true)
    expect(uebergangErlaubt("erledigt", "abgenommen")).toBe(true)
  })

  it("unerlaubte Übergänge", () => {
    expect(uebergangErlaubt("offen", "erledigt")).toBe(false)
    expect(uebergangErlaubt("offen", "offen")).toBe(false)
    expect(uebergangErlaubt("abgenommen", "in_arbeit")).toBe(false)
  })

  it("istAbgeschlossen", () => {
    expect(istAbgeschlossen("erledigt")).toBe(true)
    expect(istAbgeschlossen("abgenommen")).toBe(true)
    expect(istAbgeschlossen("abgebrochen")).toBe(true)
    expect(istAbgeschlossen("in_arbeit")).toBe(false)
  })

  it("statusUebergang liefert Verlauf + Patch", () => {
    const r = statusUebergang("offen", "zugewiesen", { jetzt: "2026-06-27T10:00:00Z" })
    expect(r.patch.status).toBe("zugewiesen")
    expect(r.verlauf).toMatchObject({ art: "status", von_status: "offen", nach_status: "zugewiesen" })
    expect(r.verlauf.am).toBe("2026-06-27T10:00:00.000Z")
  })

  it("unerlaubter Übergang wirft", () => {
    expect(() => statusUebergang("offen", "erledigt")).toThrow()
  })

  it("abgeschlossen → nur per Reaktivierung nach offen/in_arbeit", () => {
    expect(() => statusUebergang("erledigt", "in_arbeit")).toThrow()
    const r = statusUebergang("erledigt", "in_arbeit", { reaktivieren: true })
    expect(r.patch.status).toBe("in_arbeit")
    expect(() => statusUebergang("erledigt", "zugewiesen", { reaktivieren: true })).toThrow()
  })
})

describe("Schadens-Staffel", () => {
  it("schwereAusBetrag", () => {
    expect(schwereAusBetrag(30)).toBe("bagatell")
    expect(schwereAusBetrag(200)).toBe("mittel")
    expect(schwereAusBetrag(3000)).toBe("gross")
    expect(schwereAusBetrag(8000)).toBe("grossschaden")
    expect(schwereAusBetrag(50000)).toBe("grossschaden")
  })

  it("abwicklungsstufeAusBetrag (5 Stufen)", () => {
    expect(abwicklungsstufeAusBetrag(30)).toBe("kaution")
    expect(abwicklungsstufeAusBetrag(200)).toBe("plattform")
    expect(abwicklungsstufeAusBetrag(3000)).toBe("manuell")
    expect(abwicklungsstufeAusBetrag(8000)).toBe("mahnbescheid")
    expect(abwicklungsstufeAusBetrag(20000)).toBe("anwalt")
  })

  it("schadenEinstufung: Versicherung ab 500€", () => {
    expect(schadenEinstufung(200).versicherung_pruefen).toBe(false)
    expect(schadenEinstufung(600)).toMatchObject({
      schwere: "gross",
      abwicklungsstufe: "manuell",
      versicherung_pruefen: true,
    })
  })
})

describe("Eskalation", () => {
  const heute = "2026-06-27T12:00:00Z"

  it("Notfall (offen) → eskalationsgrund notfall", () => {
    expect(eskalationsGrund({ prioritaet: "notfall", status: "offen" }, heute)).toBe("notfall")
  })

  it("überfällig (faellig_am in Vergangenheit, offen) → ueberfaellig", () => {
    expect(
      eskalationsGrund({ prioritaet: "normal", status: "in_arbeit", faellig_am: "2026-06-20T00:00:00Z" }, heute)
    ).toBe("ueberfaellig")
    expect(istUeberfaellig("2026-06-20T00:00:00Z", "in_arbeit", heute)).toBe(true)
  })

  it("nicht fällig in der Zukunft / normal → null", () => {
    expect(
      eskalationFaellig({ prioritaet: "normal", status: "offen", faellig_am: "2026-07-01T00:00:00Z" }, heute)
    ).toBe(false)
  })

  it("abgeschlossen eskaliert nie", () => {
    expect(eskalationsGrund({ prioritaet: "notfall", status: "erledigt" }, heute)).toBeNull()
    expect(istUeberfaellig("2020-01-01T00:00:00Z", "abgenommen", heute)).toBe(false)
  })

  it("zeigtEskalation: manuelles Flag ODER rechnerisch", () => {
    expect(zeigtEskalation({ prioritaet: "normal", status: "offen", eskaliert: true }, heute)).toBe(true)
    expect(zeigtEskalation({ prioritaet: "normal", status: "offen", eskaliert: false }, heute)).toBe(false)
    expect(zeigtEskalation({ prioritaet: "notfall", status: "offen" }, heute)).toBe(true)
  })
})
