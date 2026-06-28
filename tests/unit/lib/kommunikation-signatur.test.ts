import { describe, expect, it } from "vitest"

import { loeseSignatur, mitSignatur } from "@/lib/kommunikation/signatur"

describe("kommunikation/signatur", () => {
  it("löst bekannte Platzhalter auf", () => {
    const out = loeseSignatur("Gruß {absender}, {marke}", { absender: "Max", marke: "ALFA CAMPUS" })
    expect(out).toBe("Gruß Max, ALFA CAMPUS")
  })

  it("lässt unbekannte/leere Platzhalter stehen", () => {
    expect(loeseSignatur("{absender} {fehlt}", { absender: "Max", fehlt: "" })).toBe("Max {fehlt}")
  })

  it("E-Mail: Signatur immer angehängt (mit Trenner)", () => {
    const out = mitSignatur({
      text: "Hallo",
      kanal: "email",
      signaturVorlage: "{marke}",
      kontext: { marke: "WIMUS" },
    })
    expect(out).toBe("Hallo\n\n-- \nWIMUS")
  })

  it("WhatsApp: Signatur nur bei erster Nachricht", () => {
    const args = { text: "Hi", kanal: "whatsapp" as const, signaturVorlage: "WIMUS", kontext: {} }
    expect(mitSignatur({ ...args, ersteNachricht: false })).toBe("Hi")
    expect(mitSignatur({ ...args, ersteNachricht: true })).toBe("Hi\n\nWIMUS")
  })

  it("ohne Vorlage: Text unverändert", () => {
    expect(mitSignatur({ text: "x", kanal: "email", signaturVorlage: null, kontext: {} })).toBe("x")
  })
})
