/**
 * Kommunikations-Schicht (Modul 007) — E-Mail-Adapter (Variante A, gratis OSS).
 *
 * Senden: Nodemailer (SMTP). Empfangen: ImapFlow + mailparser (Anhänge inline).
 * KEIN EmailEngine/rustmailer (Decision-Log). Zugangsdaten kommen ENTSCHLÜSSELT
 * herein (crypto.ts); der Adapter schreibt sie nie in Logs/Fehler.
 *
 * Empfangs-Strategie: `holeNeue(seit)` (PollenderAdapter) — per Cron/Job aufrufbar
 * (kein Dauer-IDLE-Daemon nötig, der in Next.js/Serverless schwierig ist). Echtzeit-
 * IDLE ist optional als separater Worker nachrüstbar (s. Report-Rückfrage „Host").
 *
 * Der Rest des ERP spricht nur das ChannelAdapter/PollenderAdapter-Interface.
 */

import nodemailer from "nodemailer"
import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"

import type { PollenderAdapter } from "../channel"
import type { AusgehendeNachricht, EingehendeNachricht, MedienRef, SendeErgebnis } from "../types"

export type EmailKonfig = {
  smtp: { host: string; port: number; secure: boolean }
  imap: { host: string; port: number; secure: boolean }
  benutzer: string
  passwort: string // entschlüsselt
  von: string // From-Adresse
}

export function erstelleEmailAdapter(cfg: EmailKonfig): PollenderAdapter {
  return {
    kanal: "email",

    async sendeNachricht(input: AusgehendeNachricht): Promise<SendeErgebnis> {
      try {
        const transport = nodemailer.createTransport({
          host: cfg.smtp.host,
          port: cfg.smtp.port,
          secure: cfg.smtp.secure,
          auth: { user: cfg.benutzer, pass: cfg.passwort },
        })
        const info = await transport.sendMail({
          from: cfg.von,
          to: input.an.join(", "),
          subject: input.betreff ?? "",
          text: input.text,
          attachments: (input.anhaenge ?? []).map((a) => ({
            filename: a.dateiname,
            content: a.daten,
            contentType: a.mime_typ,
          })),
        })
        return { erfolg: true, extern_id: info.messageId ?? null, status: "gesendet" }
      } catch (e) {
        return { erfolg: false, extern_id: null, status: "fehler", fehler_text: fehlerText(e) }
      }
    },

    async holeNeue(seit: Date): Promise<EingehendeNachricht[]> {
      const client = new ImapFlow({
        host: cfg.imap.host,
        port: cfg.imap.port,
        secure: cfg.imap.secure,
        auth: { user: cfg.benutzer, pass: cfg.passwort },
        logger: false,
      })
      const ergebnis: EingehendeNachricht[] = []
      await client.connect()
      const lock = await client.getMailboxLock("INBOX")
      try {
        for await (const msg of client.fetch({ since: seit }, { source: true })) {
          if (!msg.source) continue
          const parsed = await simpleParser(msg.source)
          ergebnis.push({
            kanal: "email",
            extern_id: parsed.messageId ?? null,
            von_adresse: parsed.from?.value?.[0]?.address ?? parsed.from?.text ?? null,
            an_adresse: textAdresse(parsed.to),
            betreff: parsed.subject ?? null,
            text: parsed.text ?? null,
            empfangen_am: (parsed.date ?? seit).toISOString(),
            anhaenge: (parsed.attachments ?? []).map((a) => ({
              dateiname: a.filename ?? "anhang",
              mime_typ: a.contentType ?? null,
              groesse: a.size ?? null,
              daten: a.content,
            })),
          })
        }
      } finally {
        lock.release()
        await client.logout().catch(() => {})
      }
      return ergebnis
    },

    async holeMedien(_ref: MedienRef): Promise<Buffer> {
      // E-Mail-Anhänge kommen bereits inline über holeNeue() — kein separater Abruf.
      throw new Error("E-Mail-Anhänge werden inline über holeNeue() geliefert.")
    },
  }
}

function textAdresse(to: unknown): string | null {
  if (!to) return null
  const t = to as { text?: string } | Array<{ text?: string }>
  if (Array.isArray(t)) return t.map((x) => x.text).filter(Boolean).join(", ") || null
  return t.text ?? null
}

function fehlerText(e: unknown): string {
  return e instanceof Error ? e.message : "unbekannter Fehler"
}
