/**
 * Kommunikations-Schicht (Modul 007) — Limits/Defaults.
 *
 * Zentrale, konfigurierbare Schwellen (analog bank_einstellungen-Idee), damit
 * Adapter/Autoreply keine Magic Numbers streuen.
 */

export const KOM_CONFIG = {
  /** IMAP-Poll-Intervall (Sekunden), falls kein IDLE-Daemon läuft (Cron-Poll-Fallback). */
  imapPollSekunden: 120,
  /** Max. Anhang-Größe, die wir inline verarbeiten (Bytes) — größere nur referenzieren. */
  maxAnhangBytes: 25 * 1024 * 1024,
  /** WhatsApp Rate-Limit-Schutz: min. Abstand zwischen zwei Sends je Instanz (ms). */
  waMinSendeAbstandMs: 1500,
  /** Send-Retry: max. Versuche, bevor Status endgültig `fehler` bleibt. */
  maxSendeVersuche: 3,
  /** Autoreply Anti-Schleife: kein zweiter Autoreply an denselben Kontakt/Konversation
   *  innerhalb dieses Fensters (Minuten). */
  autoreplyFensterMinuten: 60,
  /** Default-Geschäftszeiten (lokal), wenn eine Regel keine eigenen mitbringt. */
  geschaeftszeiten: { vonStunde: 8, bisStunde: 18, wochentage: [1, 2, 3, 4, 5] } as GeschaeftszeitenFenster, // Mo–Fr
} as const

export type GeschaeftszeitenFenster = {
  vonStunde: number
  bisStunde: number
  /** 0=So … 6=Sa (JS getDay). */
  wochentage: number[]
}
