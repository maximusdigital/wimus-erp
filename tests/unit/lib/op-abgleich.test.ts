import { describe, expect, it } from "vitest"

import { abgleicheEinnahme } from "@/lib/fibu/op-abgleich"

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
