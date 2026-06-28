import { beforeAll, describe, expect, it } from "vitest"

import { entschluessele, maskiere, verschluessele } from "@/lib/kommunikation/crypto"

describe("kommunikation/crypto", () => {
  beforeAll(() => {
    process.env.KOM_SECRET_KEY = "test-passphrase-fuer-kom-secrets-2026"
  })

  it("round-trip ver-/entschlüsselt korrekt", () => {
    const klar = "imap-geheim-!§$%&"
    const ct = verschluessele(klar)
    expect(ct).toMatch(/^v1:/)
    expect(ct).not.toContain(klar)
    expect(entschluessele(ct)).toBe(klar)
  })

  it("erzeugt je Aufruf anderen Ciphertext (zufälliger IV)", () => {
    expect(verschluessele("abc")).not.toBe(verschluessele("abc"))
  })

  it("liefert null bei leerem Input", () => {
    expect(verschluessele("")).toBeNull()
    expect(verschluessele(null)).toBeNull()
    expect(entschluessele(null)).toBeNull()
  })

  it("erkennt Manipulation (GCM-AuthTag)", () => {
    const ct = verschluessele("geheim")!
    const teile = ct.split(":")
    teile[3] = Buffer.from("manipuliert").toString("base64")
    expect(() => entschluessele(teile.join(":"))).toThrow()
  })

  it("wirft bei fehlendem Schlüssel", () => {
    const alt = process.env.KOM_SECRET_KEY
    delete process.env.KOM_SECRET_KEY
    expect(() => verschluessele("x")).toThrow(/KOM_SECRET_KEY/)
    process.env.KOM_SECRET_KEY = alt
  })

  it("maskiert write-only (gibt nie den Wert preis)", () => {
    expect(maskiere("v1:irgendwas")).toEqual({ gesetzt: true })
    expect(maskiere(null)).toEqual({ gesetzt: false })
    expect(maskiere("")).toEqual({ gesetzt: false })
  })
})
