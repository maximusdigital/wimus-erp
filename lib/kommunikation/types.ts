/**
 * Kommunikations-Schicht (Modul 007) — gemeinsame Typen.
 *
 * Eine Nachrichten-Wahrheit, viele Kanäle (Channel-Adapter-Pattern). Der Rest
 * des ERP spricht NUR diese Typen + das ChannelAdapter-Interface (channel.ts),
 * nie direkt IMAP/GreenAPI.
 */

export type Kanal = "email" | "whatsapp"
export type Richtung = "eingehend" | "ausgehend"

export type NachrichtStatus =
  | "empfangen"
  | "gesendet"
  | "zugestellt"
  | "gelesen"
  | "fehler"
  | "warteschlange"

/** Bezugs-Typen für die dezentrale Sicht (kom_nachricht_bezug). */
export type BezugTyp = "kontakt" | "mieter" | "einheit" | "objekt" | "vorgang" | "wg"
export type BezugQuelle = "adressiert" | "abgeleitet"

export type Bezug = {
  bezug_typ: BezugTyp
  bezug_id: string
  quelle: BezugQuelle
}

/** Ein Anhang, wie ihn ein Adapter eingehend liefert (Bytes inline). */
export type EingehenderAnhang = {
  dateiname: string
  mime_typ: string | null
  groesse: number | null
  daten: Buffer
}

/** Normalisierte eingehende Nachricht — Adapter → Inbox-Persistenz. */
export type EingehendeNachricht = {
  kanal: Kanal
  /** Message-ID (Mail) / idMessage (GreenAPI) — Dublettenschutz. */
  extern_id: string | null
  von_adresse: string | null
  an_adresse: string | null
  betreff: string | null
  text: string | null
  empfangen_am: string // ISO
  anhaenge: EingehenderAnhang[]
}

/** Ausgehende Nachricht — ERP → Adapter. */
export type AusgehendeNachricht = {
  kanal: Kanal
  /** Empfänger-Adresse(n)/Nummer(n). */
  an: string[]
  betreff?: string | null
  text: string
  anhaenge?: AusgehenderAnhang[]
  /** true bei erster Nachricht eines WA-Verlaufs / Auto-Nachricht (Signatur). */
  erste_nachricht?: boolean
}

export type AusgehenderAnhang = {
  dateiname: string
  mime_typ: string
  daten: Buffer
}

export type SendeErgebnis = {
  erfolg: boolean
  /** vom Kanal vergebene ID (Message-ID / idMessage) bei Erfolg. */
  extern_id: string | null
  status: NachrichtStatus
  fehler_text?: string | null
}

/** Referenz auf ein herunterladbares Medium (für holeMedien). */
export type MedienRef = {
  kanal: Kanal
  /** kanal-spezifischer Schlüssel (GreenAPI downloadUrl / IMAP UID+part). */
  ref: string
}

/** Kontakt-Rollen aus den kontakte.ist_*-Flags (reales Schema). */
export type KontaktRolle =
  | "mieter"
  | "eigentuemer"
  | "dienstleister"
  | "makler"
  | "tippgeber"
  | "bank"
