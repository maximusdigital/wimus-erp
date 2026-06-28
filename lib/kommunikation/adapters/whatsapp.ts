/**
 * Kommunikations-Schicht (Modul 007) — WhatsApp-Adapter (GreenAPI, native fetch).
 *
 * Kein zusätzliches SDK: GreenAPI ist reines REST. Eingehend per Webhook
 * (parseGreenApiWebhook — rein/testbar), ausgehend per sendMessage/sendFileByUrl,
 * Medien via downloadFile, Verlauf via getChatHistory. Rate-Limit-Schutz im
 * Aufrufer (KOM_CONFIG.waMinSendeAbstandMs).
 *
 * Token kommt ENTSCHLÜSSELT herein (crypto.ts) — dieser Adapter sieht Klartext nur
 * im Speicher, schreibt ihn nie in Logs/Fehler. Der Rest des ERP spricht nur das
 * ChannelAdapter-Interface.
 */

import type { ChannelAdapter } from "../channel"
import type { AusgehendeNachricht, EingehendeNachricht, MedienRef, SendeErgebnis } from "../types"

export type GreenApiKonfig = {
  host: string // z.B. https://api.green-api.com
  idInstance: string
  apiToken: string // entschlüsselt
}

/** number/JID → GreenAPI chatId. Akzeptiert bereits fertige *@c.us / *@g.us. */
export function zuChatId(an: string): string {
  if (an.includes("@")) return an
  const ziffern = an.replace(/[^\d]/g, "")
  return `${ziffern}@c.us`
}

function basis(cfg: GreenApiKonfig): string {
  return `${cfg.host.replace(/\/$/, "")}/waInstance${cfg.idInstance}`
}

/**
 * Reiner Parser: GreenAPI-Webhook-Payload → normalisierte eingehende Nachricht.
 * Gibt null zurück, wenn es keine eingehende Nachricht ist (Status-Callbacks etc.).
 * Wirft NIE — robust gegen unerwartete Strukturen (Webhook-Retry-fest).
 */
export function parseGreenApiWebhook(payload: unknown): EingehendeNachricht | null {
  const p = payload as Record<string, unknown> | null
  if (!p || p.typeWebhook !== "incomingMessageReceived") return null

  const senderData = (p.senderData ?? {}) as Record<string, unknown>
  const messageData = (p.messageData ?? {}) as Record<string, unknown>
  const idMessage = typeof p.idMessage === "string" ? p.idMessage : null
  const chatId = typeof senderData.chatId === "string" ? senderData.chatId : null
  const sender = typeof senderData.sender === "string" ? senderData.sender : chatId
  const tsRaw = typeof p.timestamp === "number" ? p.timestamp : null
  const empfangen_am = (tsRaw ? new Date(tsRaw * 1000) : new Date(0)).toISOString()

  const typ = messageData.typeMessage as string | undefined
  let text: string | null = null
  const anhaenge: EingehendeNachricht["anhaenge"] = []

  if (typ === "textMessage" || typ === "extendedTextMessage") {
    const td = (messageData.textMessageData ?? messageData.extendedTextMessageData ?? {}) as Record<string, unknown>
    text = (td.textMessage as string) ?? (td.text as string) ?? null
  } else if (typ && typ.endsWith("Message")) {
    // image/document/video/audio: fileMessageData mit downloadUrl + caption
    const fd = (messageData.fileMessageData ?? {}) as Record<string, unknown>
    text = (fd.caption as string) ?? null
    const downloadUrl = fd.downloadUrl as string | undefined
    if (downloadUrl) {
      anhaenge.push({
        dateiname: (fd.fileName as string) ?? "anhang",
        mime_typ: (fd.mimeType as string) ?? null,
        groesse: null,
        // Bytes lädt der Aufrufer per holeMedien({ ref: downloadUrl }) nach.
        daten: Buffer.from(downloadUrl, "utf8"), // Platzhalter: URL; echte Bytes via holeMedien
      })
    }
  }

  return {
    kanal: "whatsapp",
    extern_id: idMessage,
    von_adresse: sender,
    an_adresse: null, // eigene Instanz-Nummer; im Persistenz-Layer aus wa_instanz gesetzt
    betreff: null,
    text,
    empfangen_am,
    anhaenge,
  }
}

export function erstelleWhatsappAdapter(cfg: GreenApiKonfig): ChannelAdapter {
  return {
    kanal: "whatsapp",

    async sendeNachricht(input: AusgehendeNachricht): Promise<SendeErgebnis> {
      try {
        const url = `${basis(cfg)}/sendMessage/${cfg.apiToken}`
        // Mehrfach-Empfänger: GreenAPI sendet je chatId einzeln; erste ID = Referenz.
        let ersteId: string | null = null
        for (const an of input.an) {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: zuChatId(an), message: input.text }),
          })
          if (!res.ok) {
            return { erfolg: false, extern_id: null, status: "fehler", fehler_text: `GreenAPI HTTP ${res.status}` }
          }
          const json = (await res.json().catch(() => ({}))) as { idMessage?: string }
          ersteId = ersteId ?? json.idMessage ?? null
        }
        return { erfolg: true, extern_id: ersteId, status: "gesendet" }
      } catch (e) {
        return { erfolg: false, extern_id: null, status: "fehler", fehler_text: fehlerText(e) }
      }
    },

    async holeMedien(ref: MedienRef): Promise<Buffer> {
      // ref.ref = downloadUrl aus dem Webhook (zeitlich begrenzt gültig).
      const res = await fetch(ref.ref)
      if (!res.ok) throw new Error(`Medien-Download HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    },
  }
}

/** Chatverlauf-Import (GetChatHistory) — für initiales Befüllen eines Threads. */
export async function holeChatverlauf(
  cfg: GreenApiKonfig,
  chatId: string,
  count = 100,
): Promise<unknown[]> {
  const res = await fetch(`${basis(cfg)}/getChatHistory/${cfg.apiToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: zuChatId(chatId), count }),
  })
  if (!res.ok) throw new Error(`getChatHistory HTTP ${res.status}`)
  return (await res.json().catch(() => [])) as unknown[]
}

/** Fehlertext ohne Secrets (Token/Headers werden nie eingebettet). */
function fehlerText(e: unknown): string {
  return e instanceof Error ? e.message : "unbekannter Fehler"
}
