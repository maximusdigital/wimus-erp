/**
 * Kommunikations-Schicht (Modul 007) — Ausgehender Sende-Orchestrator (WhatsApp).
 *
 * Lädt die WA-Instanz, entschlüsselt den GreenAPI-Token (crypto.ts / KOM_SECRET_KEY),
 * baut den Adapter, sendet und persistiert das Ergebnis (auch Fehler — Retry-Diagnose)
 * über persistiereAusgehend (das schreibt Nachricht + Bezüge + Historie). Server-only.
 *
 * Der Adapter wirft NICHT — Fehler kommen als SendeErgebnis(status='fehler') zurück.
 */
import type { createAdminClient } from "../supabase/admin"
import { entschluessele } from "./crypto"
import { erstelleWhatsappAdapter } from "./adapters/whatsapp"
import { persistiereAusgehend } from "./inbox"
import type { SendeErgebnis } from "./types"

type AdminClient = ReturnType<typeof createAdminClient>

export type SendeWhatsappInput = {
  wa_instanz_id: string
  /** Empfänger-Nummer/chatId (zuChatId normalisiert im Adapter). */
  an: string
  text: string
  kontakt_id?: string | null
  ist_autoreply?: boolean
}

export type SendeAntwort = SendeErgebnis & { nachricht_id: string | null }

function fehler(text: string): SendeAntwort {
  return { erfolg: false, extern_id: null, status: "fehler", fehler_text: text, nachricht_id: null }
}

export async function sendeWhatsapp(supabase: AdminClient, input: SendeWhatsappInput): Promise<SendeAntwort> {
  // 1. Instanz + Token laden.
  const { data: inst } = await supabase
    .from("kom_wa_instanzen")
    .select("id, mandant_id, green_id_instance, green_api_host, green_api_token_verschluesselt, aktiv")
    .eq("id", input.wa_instanz_id)
    .maybeSingle()
  if (!inst || !inst.aktiv) return fehler("WA-Instanz unbekannt oder inaktiv")

  let apiToken: string | null = null
  try {
    apiToken = entschluessele(inst.green_api_token_verschluesselt)
  } catch {
    apiToken = null
  }
  if (!apiToken) return fehler("Kein/ungültiger GreenAPI-Token (KOM_SECRET_KEY gesetzt?)")

  // 2. Senden (Adapter wirft nie → Ergebnis trägt Status).
  const adapter = erstelleWhatsappAdapter({
    host: inst.green_api_host ?? "https://api.green-api.com",
    idInstance: inst.green_id_instance,
    apiToken,
  })
  const res = await adapter.sendeNachricht({
    kanal: "whatsapp",
    an: [input.an],
    text: input.text,
    erste_nachricht: input.ist_autoreply,
  })

  // 3. Persistieren (auch bei Fehler — für Retry/Diagnose) + Historie bei Erfolg.
  let nachricht_id: string | null = null
  try {
    const r = await persistiereAusgehend(
      supabase,
      { mandant_id: inst.mandant_id, kanal: "whatsapp", wa_instanz_id: inst.id },
      {
        an_adresse: input.an,
        text: input.text,
        kontakt_id: input.kontakt_id ?? null,
        extern_id: res.extern_id,
        status: res.status,
        fehler_text: res.fehler_text ?? null,
        ist_autoreply: input.ist_autoreply,
      },
    )
    nachricht_id = r.nachricht_id
  } catch {
    /* Persistenz-Fehler darf das Sende-Ergebnis nicht verschlucken */
  }

  return { ...res, nachricht_id }
}
