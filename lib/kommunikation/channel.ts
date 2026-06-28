/**
 * Kommunikations-Schicht (Modul 007) — Adapter-Interface.
 *
 * Der Rest des ERP spricht NUR dieses Interface, nie IMAP/GreenAPI direkt.
 * Eingehend pusht der Adapter normalisierte Nachrichten in die Inbox-Persistenz
 * (lib/kommunikation/inbox.ts) — getriggert durch IMAP IDLE / Cron-Poll (E-Mail)
 * bzw. GreenAPI-Webhook (WhatsApp).
 */

import type {
  AusgehendeNachricht,
  EingehendeNachricht,
  MedienRef,
  Kanal,
  SendeErgebnis,
} from "./types"

export interface ChannelAdapter {
  kanal: Kanal

  /** Ausgehend senden. Fehler werfen NICHT — Ergebnis trägt status `fehler` +
   *  fehler_text, damit die ERP-Persistenz nie blockiert (Retry-Queue-Muster). */
  sendeNachricht(input: AusgehendeNachricht): Promise<SendeErgebnis>

  /** Medium (Anhang) nachladen — GreenAPI DownloadFile / IMAP FETCH part. */
  holeMedien(ref: MedienRef): Promise<Buffer>
}

/**
 * Optionale Poll-Fähigkeit (E-Mail-Cron-Fallback statt IDLE-Daemon): liefert
 * neue eingehende Nachrichten seit einem Zeitpunkt. WhatsApp braucht das nicht
 * (Push via Webhook).
 */
export interface PollenderAdapter extends ChannelAdapter {
  holeNeue(seit: Date): Promise<EingehendeNachricht[]>
}
