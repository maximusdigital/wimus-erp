import { describe, expect, it } from "vitest"

import { parseGreenApiWebhook, zuChatId } from "@/lib/kommunikation/adapters/whatsapp"
import { normalisiereAdresse, istBelegKandidat } from "@/lib/kommunikation/inbox"

describe("kommunikation/whatsapp – parseGreenApiWebhook", () => {
  it("parst Textnachricht", () => {
    const n = parseGreenApiWebhook({
      typeWebhook: "incomingMessageReceived",
      idMessage: "ABC123",
      timestamp: 1782000000,
      senderData: { chatId: "4915112345678@c.us", sender: "4915112345678@c.us" },
      messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "Hallo WIMUS" } },
    })
    expect(n).not.toBeNull()
    expect(n!.extern_id).toBe("ABC123")
    expect(n!.text).toBe("Hallo WIMUS")
    expect(n!.von_adresse).toBe("4915112345678@c.us")
    expect(n!.anhaenge).toHaveLength(0)
  })

  it("parst Bildnachricht mit Anhang + caption", () => {
    const n = parseGreenApiWebhook({
      typeWebhook: "incomingMessageReceived",
      idMessage: "IMG1",
      senderData: { chatId: "49151@c.us", sender: "49151@c.us" },
      messageData: {
        typeMessage: "imageMessage",
        fileMessageData: { downloadUrl: "https://media/x.jpg", fileName: "beleg.jpg", mimeType: "image/jpeg", caption: "Quittung" },
      },
    })
    expect(n!.text).toBe("Quittung")
    expect(n!.anhaenge).toHaveLength(1)
    expect(n!.anhaenge[0].mime_typ).toBe("image/jpeg")
  })

  it("ignoriert Nicht-Eingangs-Webhooks", () => {
    expect(parseGreenApiWebhook({ typeWebhook: "outgoingMessageStatus" })).toBeNull()
    expect(parseGreenApiWebhook(null)).toBeNull()
    expect(parseGreenApiWebhook({})).toBeNull()
  })

  it("zuChatId normalisiert Nummern", () => {
    expect(zuChatId("+49 151 12345678")).toBe("4915112345678@c.us")
    expect(zuChatId("4915112345678@c.us")).toBe("4915112345678@c.us")
  })
})

describe("kommunikation/inbox – Helfer", () => {
  it("normalisiert E-Mail-Adressen (inkl. Name <…>)", () => {
    expect(normalisiereAdresse("Max Moser <Info@WIMUS.de>", "email")).toBe("info@wimus.de")
    expect(normalisiereAdresse("info@wimus.de", "email")).toBe("info@wimus.de")
  })

  it("normalisiert WhatsApp-Nummern auf Ziffern", () => {
    expect(normalisiereAdresse("4915112345678@c.us", "whatsapp")).toBe("4915112345678")
    expect(normalisiereAdresse(null, "whatsapp")).toBeNull()
  })

  it("erkennt Beleg-Kandidaten (Bild/PDF)", () => {
    expect(istBelegKandidat("image/jpeg")).toBe(true)
    expect(istBelegKandidat("application/pdf")).toBe(true)
    expect(istBelegKandidat("text/plain")).toBe(false)
    expect(istBelegKandidat(null)).toBe(false)
  })
})
