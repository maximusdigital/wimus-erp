import { describe, expect, it } from "vitest"

import { abgleicheEinnahme, verteileEinnahme } from "@/lib/fibu/op-abgleich"

describe("abgleicheEinnahme", () => {
  it("vollständige Zahlung → bezahlt", () => {
    const r = abgleicheEinnahme(800, { id: "f1", betrag: 800, bezahlt_betrag: 0 })
    expect(r).toMatchObject({
      forderung_id: "f1",
      neuer_bezahlt_betrag: 800,
      neuer_status: "bezahlt",
      verbucht: 800,
      guthaben: 0,
      art: "vollstaendig",
    })
  })

  it("Teilzahlung → teilbezahlt, Rest offen", () => {
    const r = abgleicheEinnahme(300, { id: "f1", betrag: 800, bezahlt_betrag: 0 })
    expect(r.neuer_status).toBe("teilbezahlt")
    expect(r.verbucht).toBe(300)
    expect(r.guthaben).toBe(0)
    expect(r.art).toBe("teilzahlung")
  })

  it("Überzahlung → bezahlt + Guthaben", () => {
    const r = abgleicheEinnahme(900, { id: "f1", betrag: 800, bezahlt_betrag: 0 })
    expect(r.neuer_status).toBe("bezahlt")
    expect(r.verbucht).toBe(800)
    expect(r.guthaben).toBe(100)
    expect(r.art).toBe("ueberzahlung")
  })

  it("auf bereits teilbezahlte Forderung aufaddieren", () => {
    const r = abgleicheEinnahme(500, { id: "f1", betrag: 800, bezahlt_betrag: 300 })
    expect(r.neuer_bezahlt_betrag).toBe(800)
    expect(r.neuer_status).toBe("bezahlt")
  })

  it("keine Forderung → komplettes Guthaben", () => {
    const r = abgleicheEinnahme(800, null)
    expect(r.art).toBe("keine_forderung")
    expect(r.guthaben).toBe(800)
    expect(r.forderung_id).toBeNull()
  })
})

describe("verteileEinnahme (FIFO-Kaskade)", () => {
  const f = (id: string, betrag: number, bezahlt = 0) => ({ id, betrag, bezahlt_betrag: bezahlt })

  it("eine Forderung vollständig", () => {
    const r = verteileEinnahme(800, [f("a", 800)])
    expect(r.allokationen).toHaveLength(1)
    expect(r.allokationen[0]).toMatchObject({ forderung_id: "a", neuer_status: "bezahlt", verbucht: 800 })
    expect(r.guthaben).toBe(0)
  })

  it("Überzahlung bedient nächste Forderung (FIFO)", () => {
    const r = verteileEinnahme(900, [f("a", 800), f("b", 800)])
    expect(r.allokationen).toHaveLength(2)
    expect(r.allokationen[0]).toMatchObject({ forderung_id: "a", neuer_status: "bezahlt", verbucht: 800 })
    expect(r.allokationen[1]).toMatchObject({ forderung_id: "b", neuer_status: "teilbezahlt", verbucht: 100 })
    expect(r.guthaben).toBe(0)
    expect(r.verbucht_gesamt).toBe(900)
  })

  it("Überzahlung über alle Forderungen → Restguthaben", () => {
    const r = verteileEinnahme(2000, [f("a", 800)])
    expect(r.allokationen).toHaveLength(1)
    expect(r.allokationen[0].neuer_status).toBe("bezahlt")
    expect(r.guthaben).toBe(1200)
  })

  it("keine offenen Forderungen → komplettes Guthaben", () => {
    const r = verteileEinnahme(800, [])
    expect(r.allokationen).toHaveLength(0)
    expect(r.guthaben).toBe(800)
  })
})
