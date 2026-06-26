import { describe, expect, it } from "vitest"

import {
  istAbgeschlossen,
  istStalled,
  stageUebergang,
  tageInStage,
  tageZwischen,
} from "@/lib/crm/stage"
import { istKonvertierbar, konvertiereLead, verwerfeLead } from "@/lib/crm/lead"
import { erwarteterWert, fehlendePflichtfelder, neuFormularFelder } from "@/lib/crm/deal"
import type { CustomFieldDefinition, Lead } from "@/types/crm"

// ---------------------------------------------------------------------
// Stage-Logik
// ---------------------------------------------------------------------
describe("tageZwischen / tageInStage", () => {
  it("zählt ganze Tage, nie negativ", () => {
    expect(tageZwischen("2026-06-01T00:00:00Z", "2026-06-08T00:00:00Z")).toBe(7)
    expect(tageZwischen("2026-06-08T00:00:00Z", "2026-06-01T00:00:00Z")).toBe(0)
    expect(tageInStage("2026-06-20T10:00:00Z", "2026-06-26T10:00:00Z")).toBe(6)
  })
})

describe("istStalled", () => {
  it("true ab Erreichen der Schwelle, null = nie", () => {
    expect(istStalled(14, 14)).toBe(true)
    expect(istStalled(13, 14)).toBe(false)
    expect(istStalled(99, null)).toBe(false)
  })
})

describe("stageUebergang", () => {
  it("schreibt Historie mit Verweildauer + setzt Stage-Timer neu", () => {
    const r = stageUebergang(
      { stage_id: "s1", in_stage_seit: "2026-06-20T00:00:00Z", status: "offen" },
      "s2",
      "2026-06-26T00:00:00Z"
    )
    expect(r.historie.von_stage_id).toBe("s1")
    expect(r.historie.nach_stage_id).toBe("s2")
    expect(r.historie.verweildauer_tage).toBe(6)
    expect(r.patch.stage_id).toBe("s2")
    expect(r.patch.in_stage_seit).toBe("2026-06-26T00:00:00.000Z")
  })

  it("abgeschlossener Deal → Stage-Wechsel gesperrt", () => {
    expect(() =>
      stageUebergang(
        { stage_id: "s1", in_stage_seit: "2026-06-20T00:00:00Z", status: "gewonnen" },
        "s2"
      )
    ).toThrow()
    expect(istAbgeschlossen("verloren")).toBe(true)
    expect(istAbgeschlossen("offen")).toBe(false)
  })
})

// ---------------------------------------------------------------------
// Lead-Triage & Konvertierung
// ---------------------------------------------------------------------
const baseLead: Pick<Lead, "status" | "deal_id" | "kontakt_id" | "organisation_id" | "custom_values"> = {
  status: "neu",
  deal_id: null,
  kontakt_id: "k1",
  organisation_id: null,
  custom_values: {},
}

describe("Lead verwerfen", () => {
  it("setzt status + Grund; leerer Grund wirft", () => {
    expect(verwerfeLead("Kein Bedarf")).toEqual({
      status: "verworfen",
      verworfen_grund: "Kein Bedarf",
    })
    expect(() => verwerfeLead("   ")).toThrow()
  })
})

describe("Lead konvertieren", () => {
  it("erzeugt Deal-Payload (status offen) + Lead-Patch konvertiert", () => {
    const r = konvertiereLead(
      baseLead,
      { firma_id: "f1", pipeline_id: "p1", stage_id: "s1", titel: "Neuer Deal" },
      "deal-123"
    )
    expect(r.deal.status).toBe("offen")
    expect(r.deal.firma_id).toBe("f1")
    expect(r.deal.kontakt_id).toBe("k1") // vom Lead übernommen
    expect(r.leadPatch).toEqual({ status: "konvertiert", deal_id: "deal-123" })
  })

  it("Organisation wird durchgereicht; Kontakt optional", () => {
    const r = konvertiereLead(
      { ...baseLead, kontakt_id: null, organisation_id: "o9" },
      { firma_id: "f1", pipeline_id: "p1", stage_id: "s1", titel: "Org-Deal" },
      "d2"
    )
    expect(r.deal.organisation_id).toBe("o9")
    expect(r.deal.kontakt_id).toBeNull()
  })

  it("ohne firma_id (Mandant) → abgelehnt", () => {
    expect(() =>
      konvertiereLead(baseLead, { firma_id: "", pipeline_id: "p1", stage_id: "s1", titel: "x" }, "d")
    ).toThrow()
  })

  it("bereits konvertierter Lead → nicht erneut konvertierbar", () => {
    const done = { ...baseLead, status: "konvertiert" as const, deal_id: "d1" }
    expect(istKonvertierbar(done)).toBe(false)
    expect(() =>
      konvertiereLead(done, { firma_id: "f1", pipeline_id: "p1", stage_id: "s1", titel: "x" }, "d2")
    ).toThrow()
  })
})

// ---------------------------------------------------------------------
// Deal: Forecast + Custom-Field-Pflicht
// ---------------------------------------------------------------------
describe("erwarteterWert", () => {
  it("= Wert × Wahrscheinlichkeit/100", () => {
    expect(erwarteterWert(10000, 25)).toBe(2500)
    expect(erwarteterWert(null, 50)).toBe(0)
  })
})

describe("Custom-Field-Pflicht & Sichtbarkeit", () => {
  const defs: CustomFieldDefinition[] = [
    {
      id: "cf1",
      mandant_id: "m",
      entitaet: "deal",
      name: "Budget",
      feldtyp: "betrag",
      optionen: [],
      anzeige_hinzufuegen: true,
      anzeige_detail: true,
      pflicht: true,
      wichtig: false,
      pipeline_id: null,
      sortierung: 1,
      aktiv: true,
    },
    {
      id: "cf2",
      mandant_id: "m",
      entitaet: "deal",
      name: "Quelle-Detail",
      feldtyp: "text",
      optionen: [],
      anzeige_hinzufuegen: false, // nur Detail
      anzeige_detail: true,
      pflicht: false,
      wichtig: true,
      pipeline_id: null,
      sortierung: 2,
      aktiv: true,
    },
    {
      id: "cf3",
      mandant_id: "m",
      entitaet: "deal",
      name: "Nur Pipeline P2",
      feldtyp: "text",
      optionen: [],
      anzeige_hinzufuegen: true,
      anzeige_detail: true,
      pflicht: true,
      wichtig: false,
      pipeline_id: "p2",
      sortierung: 3,
      aktiv: true,
    },
  ]

  it("fehlendes Pflichtfeld → gemeldet", () => {
    const fehlt = fehlendePflichtfelder(defs, {}, { entitaet: "deal", pipelineId: "p1" })
    expect(fehlt).toContain("Budget")
  })

  it("ausgefülltes Pflichtfeld → ok", () => {
    const fehlt = fehlendePflichtfelder(defs, { cf1: 5000 }, { entitaet: "deal", pipelineId: "p1" })
    expect(fehlt).toEqual([])
  })

  it("Feld nur anzeige_detail → nicht im Neu-Formular", () => {
    const neu = neuFormularFelder(defs, { entitaet: "deal", pipelineId: "p1" })
    expect(neu.map((f) => f.id)).toContain("cf1")
    expect(neu.map((f) => f.id)).not.toContain("cf2")
  })

  it("pipeline-spezifisches Pflichtfeld greift nur in seiner Pipeline", () => {
    expect(fehlendePflichtfelder(defs, { cf1: 1 }, { entitaet: "deal", pipelineId: "p1" })).toEqual([])
    expect(
      fehlendePflichtfelder(defs, { cf1: 1 }, { entitaet: "deal", pipelineId: "p2" })
    ).toContain("Nur Pipeline P2")
  })
})
