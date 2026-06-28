/**
 * Kommunikations-Schicht (Modul 007) — Inbox-Persistenz (eingehend/ausgehend).
 *
 * Adapter pushen normalisierte Nachrichten hier herein; diese Schicht schreibt die
 * gemeinsame Wahrheit (`kom_nachrichten` + `kom_anhaenge` + `kom_konversationen` +
 * `kom_nachricht_bezug`). Dublettenschutz über extern_id (DB-Unique fängt Race ab).
 * Kontakt-Zuordnung über Absender-Adresse/Nummer. Belegfoto-Anhänge → Kern-OCR
 * (verarbeiteBeleg) — KEINE zweite Pipeline.
 *
 * NUR serverseitig (Admin-Client umgeht RLS; Mandant wird explizit gesetzt — der
 * Webhook/Job ordnet VOR dem Schreiben dem richtigen Mandanten zu).
 */

import type { createAdminClient } from "../supabase/admin"
import { protokolliere } from "../historie/protokolliere"
import { leiteBezuege, type BezugEingabe } from "./bezug"
import type { EingehendeNachricht, Kanal } from "./types"

const KANAL_LABEL: Record<Kanal, string> = { email: "E-Mail", whatsapp: "WhatsApp" }

type AdminClient = ReturnType<typeof createAdminClient>

/** Adresse/Nummer normalisieren für Kontakt-Matching (rein/testbar). */
export function normalisiereAdresse(adresse: string | null | undefined, kanal: Kanal): string | null {
  if (!adresse) return null
  if (kanal === "email") {
    const m = adresse.match(/<([^>]+)>/) // "Name <a@b.de>" → a@b.de
    return (m ? m[1] : adresse).trim().toLowerCase() || null
  }
  // whatsapp: chatId/JID/Nummer → nur Ziffern
  const ziffern = adresse.replace(/[^\d]/g, "")
  return ziffern || null
}

export type EingangsKontext = {
  mandant_id: string
  kanal: Kanal
  postfach_id?: string | null
  wa_instanz_id?: string | null
}

/** Findet einen Kontakt anhand E-Mail/Telefonnummer (best effort). */
async function findeKontakt(
  supabase: AdminClient,
  mandant_id: string,
  kanal: Kanal,
  adresse: string | null,
): Promise<{ id: string; einheit_id: string | null; objekt_id: string | null; ist_mieter: boolean } | null> {
  if (!adresse) return null
  const spalte = kanal === "email" ? "email" : "telefon_mobil"
  const { data } = await supabase
    .from("kontakte")
    .select("id, ist_mieter")
    .eq("mandant_id", mandant_id)
    .ilike(spalte, kanal === "email" ? adresse : `%${adresse.slice(-8)}%`)
    .limit(1)
    .maybeSingle()
  if (!data) return null
  // Einheit/Objekt-Ableitung (aktueller MV) — optional, nur bei Mietern relevant.
  let einheit_id: string | null = null
  let objekt_id: string | null = null
  if (data.ist_mieter) {
    const { data: mv } = await supabase
      .from("mietvertraege")
      .select("einheit_id, einheit:einheiten!einheit_id(objekt_id)")
      .eq("mandant_id", mandant_id)
      .eq("mieter_id", data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    einheit_id = (mv?.einheit_id as string) ?? null
    const einheit = mv?.einheit as { objekt_id?: string } | { objekt_id?: string }[] | null
    objekt_id = (Array.isArray(einheit) ? einheit[0]?.objekt_id : einheit?.objekt_id) ?? null
  }
  return { id: data.id, einheit_id, objekt_id, ist_mieter: Boolean(data.ist_mieter) }
}

/**
 * Persistiert eine eingehende Nachricht. Idempotent über extern_id: existiert sie
 * schon, wird die vorhandene ID zurückgegeben (Webhook-Retry-fest).
 * Gibt { nachricht_id, kontakt_id, neu } zurück.
 */
export async function persistiereEingehend(
  supabase: AdminClient,
  ctx: EingangsKontext,
  nachricht: EingehendeNachricht,
): Promise<{ nachricht_id: string; kontakt_id: string | null; neu: boolean }> {
  // 1. Dublettenschutz
  if (nachricht.extern_id) {
    const { data: vorhanden } = await supabase
      .from("kom_nachrichten")
      .select("id, kontakt_id")
      .eq("kanal", ctx.kanal)
      .eq("extern_id", nachricht.extern_id)
      .maybeSingle()
    if (vorhanden) return { nachricht_id: vorhanden.id, kontakt_id: vorhanden.kontakt_id, neu: false }
  }

  // 2. Kontakt zuordnen
  const adresse = normalisiereAdresse(nachricht.von_adresse, ctx.kanal)
  const kontakt = await findeKontakt(supabase, ctx.mandant_id, ctx.kanal, adresse)

  // 3. Konversation finden/anlegen (je Kontakt+Kanal)
  const konversation_id = await holeOderErstelleKonversation(supabase, ctx, kontakt?.id ?? null, nachricht.betreff)

  // 4. Nachricht schreiben
  const { data: ins, error } = await supabase
    .from("kom_nachrichten")
    .insert({
      mandant_id: ctx.mandant_id,
      kanal: ctx.kanal,
      richtung: "eingehend",
      postfach_id: ctx.postfach_id ?? null,
      wa_instanz_id: ctx.wa_instanz_id ?? null,
      konversation_id,
      extern_id: nachricht.extern_id,
      von_adresse: nachricht.von_adresse,
      an_adresse: nachricht.an_adresse,
      betreff: nachricht.betreff,
      text: nachricht.text,
      hat_anhaenge: nachricht.anhaenge.length > 0,
      status: "empfangen",
      kontakt_id: kontakt?.id ?? null,
      empfangen_am: nachricht.empfangen_am,
    })
    .select("id")
    .single()
  if (error || !ins) throw new Error(`Persistenz eingehend fehlgeschlagen: ${error?.message}`)

  // 5. Bezüge (zentral ↔ dezentral)
  if (kontakt) {
    const eingabe: BezugEingabe = {
      kontakte: [{ kontakt_id: kontakt.id, einheit_id: kontakt.einheit_id, objekt_id: kontakt.objekt_id, ist_mieter: kontakt.ist_mieter }],
    }
    const bezuege = leiteBezuege(eingabe)
    if (bezuege.length > 0) {
      await supabase.from("kom_nachricht_bezug").upsert(
        bezuege.map((b) => ({ mandant_id: ctx.mandant_id, nachricht_id: ins.id, ...b })),
        { onConflict: "nachricht_id,bezug_typ,bezug_id", ignoreDuplicates: true },
      )
    }
  }

  // 6. Anhänge (Bytes-Ablage + ggf. OCR-Routing übernimmt der Aufrufer/Job).
  if (nachricht.anhaenge.length > 0) {
    await supabase.from("kom_anhaenge").insert(
      nachricht.anhaenge.map((a) => ({
        mandant_id: ctx.mandant_id,
        nachricht_id: ins.id,
        dateiname: a.dateiname,
        mime_typ: a.mime_typ,
        groesse: a.groesse,
        ocr_status: istBelegKandidat(a.mime_typ) ? "offen" : "nicht_relevant",
      })),
    )
  }

  // 7. Historie (Modul 009): fachliche Aktivität „Nachricht empfangen".
  //    Nur bei zugeordnetem Kontakt (sonst kein Entitäts-Bezug). Blockiert nie.
  if (kontakt) {
    await protokolliere(supabase, ctx.mandant_id, {
      typ: "nachricht_empfangen",
      modul: "kommunikation",
      titel: `${KANAL_LABEL[ctx.kanal]} empfangen`,
      beschreibung: nachricht.betreff ?? nachricht.text?.slice(0, 140) ?? null,
      payload: { kanal: ctx.kanal, nachricht_id: ins.id, von: nachricht.von_adresse },
      primaerBezug: { typ: kontakt.ist_mieter ? "mieter" : "kontakt", id: kontakt.id },
      hierarchie: { einheit_id: kontakt.einheit_id, objekt_id: kontakt.objekt_id },
    })
  }

  return { nachricht_id: ins.id, kontakt_id: kontakt?.id ?? null, neu: true }
}

async function holeOderErstelleKonversation(
  supabase: AdminClient,
  ctx: EingangsKontext,
  kontakt_id: string | null,
  betreff: string | null,
): Promise<string> {
  if (kontakt_id) {
    const { data } = await supabase
      .from("kom_konversationen")
      .select("id")
      .eq("mandant_id", ctx.mandant_id)
      .eq("kanal", ctx.kanal)
      .eq("kontakt_id", kontakt_id)
      .order("letzter_nachricht_am", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    if (data) return data.id
  }
  const { data: neu, error } = await supabase
    .from("kom_konversationen")
    .insert({
      mandant_id: ctx.mandant_id,
      kanal: ctx.kanal,
      kontakt_id,
      betreff,
      letzter_nachricht_am: new Date().toISOString(),
    })
    .select("id")
    .single()
  if (error || !neu) throw new Error(`Konversation anlegen fehlgeschlagen: ${error?.message}`)
  return neu.id
}

/** Belegfoto-Kandidat (Bild/PDF) → OCR-Routing (verarbeiteBeleg) durch Job. */
export function istBelegKandidat(mime: string | null): boolean {
  if (!mime) return false
  return mime.startsWith("image/") || mime === "application/pdf"
}
