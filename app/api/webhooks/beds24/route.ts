import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { citytaxBetrag } from "@/lib/utils/citytax"

/**
 * Beds24-Webhook (Phase 3, KZV-Vollautomatisierung) – SKELETON.
 *
 * Verifiziert ein geteiltes Secret, legt/aktualisiert die Buchung in
 * public.buchungen_kzv an und kopiert den statischen Keybox-PIN aus der Einheit.
 * Läuft OHNE User-Session → Admin-Client (Service-Role, umgeht RLS). Deshalb
 * MUSS jeder Datensatz einer Einheit/Mandant zugeordnet werden.
 *
 * Bewusst NICHT hier implementiert (gehört in n8n, Schaltzentrale-Prinzip):
 *   - dynamischer Apartment-PIN via TTLock/Nuki
 *   - Tuya-Heizungs-Szene (Vortemperierung)
 *   - WhatsApp-Bestätigung (GreenAPI)
 *   - Reinigungsauftrag / Rechnung (Invoice Ninja, 7% USt)
 *   - Gästeprofil als Kontakt anlegen
 * Dieser Endpoint persistiert die Buchung; die Aktoren triggert n8n nachgelagert.
 */

export const runtime = "nodejs"

/** Konstanter-Zeit-Vergleich für das Webhook-Secret. */
function secretOk(provided: string | null): boolean {
  const expected = process.env.BEDS24_WEBHOOK_SECRET
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Beds24-Status grob auf unser Status-Vokabular abbilden. */
function mapStatus(raw: unknown): string {
  const s = String(raw ?? "").toLowerCase()
  if (s.includes("cancel")) return "storniert"
  if (s.includes("request") || s === "0") return "angefragt"
  return "bestaetigt"
}

export async function POST(request: NextRequest) {
  // 1) Secret prüfen (Header oder Query – Beds24 erlaubt einen festen Parameter).
  const provided =
    request.headers.get("x-beds24-token") ??
    request.nextUrl.searchParams.get("token")
  if (!secretOk(provided)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ungültiger Payload" }, { status: 400 })
  }
  const p = payload as Record<string, unknown>

  const beds24Id = String(p.bookId ?? p.beds24_id ?? p.id ?? "").trim()
  if (!beds24Id) {
    return NextResponse.json({ error: "beds24_id fehlt" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 2) Einheit auflösen – liefert mandant_id, objekt_id und den Keybox-PIN.
  //    Mapping über UUID (einheit_id) oder Verwendungszweck-Code.
  const einheitId =
    typeof p.einheit_id === "string" ? p.einheit_id.trim() : null
  const vzCode =
    typeof p.verwendungszweck_code === "string"
      ? p.verwendungszweck_code.trim().toUpperCase()
      : null

  type EinheitRow = {
    id: string
    mandant_id: string
    objekt_id: string | null
    keybox_pin_statisch: string | null
  }
  let einheit: EinheitRow | null = null

  if (einheitId || vzCode) {
    const sel = supabase
      .from("einheiten")
      .select("id, mandant_id, objekt_id, keybox_pin_statisch")
      .limit(1)
    const { data } = einheitId
      ? await sel.eq("id", einheitId).maybeSingle()
      : await sel.eq("verwendungszweck_code", vzCode!).maybeSingle()
    einheit = (data as unknown as EinheitRow | null) ?? null
  }

  // mandant_id ist Pflicht. Aus der Einheit, sonst konfigurierter Default.
  const mandantId = einheit?.mandant_id ?? process.env.BEDS24_DEFAULT_MANDANT_ID
  if (!mandantId) {
    return NextResponse.json(
      {
        error:
          "Mandant nicht auflösbar – Einheit nicht gefunden und kein BEDS24_DEFAULT_MANDANT_ID gesetzt.",
      },
      { status: 422 }
    )
  }

  // 3) Stadt für CityTax aus dem Objekt holen.
  let ort: string | null = null
  if (einheit?.objekt_id) {
    const { data: objekt } = await supabase
      .from("objekte")
      .select("ort")
      .eq("id", einheit.objekt_id)
      .maybeSingle()
    ort = (objekt?.ort as string | null) ?? null
  }

  const checkin = typeof p.checkin === "string" ? p.checkin : null
  const checkout = typeof p.checkout === "string" ? p.checkout : null
  const personen =
    p.personen != null ? Number(p.personen) : p.numAdult != null ? Number(p.numAdult) : null
  const betrag = p.betrag != null ? Number(p.betrag) : p.price != null ? Number(p.price) : null

  const cityTax = citytaxBetrag({ stadt: ort, personen, checkin, checkout })

  const row = {
    mandant_id: mandantId,
    einheit_id: einheit?.id ?? null,
    objekt_id: einheit?.objekt_id ?? null,
    beds24_id: beds24Id,
    kanal: typeof p.kanal === "string" ? p.kanal : (p.referer as string) ?? null,
    checkin,
    checkout,
    personen: Number.isFinite(personen) ? personen : null,
    betrag: Number.isFinite(betrag) ? betrag : null,
    city_tax: cityTax,
    keybox_pin: einheit?.keybox_pin_statisch ?? null,
    // apartment_pin bleibt offen → wird von n8n (TTLock) nachgetragen.
    status: mapStatus(p.status),
  }

  // 4) Upsert auf (mandant_id, beds24_id) – idempotent bei Webhook-Retries.
  const { data, error } = await supabase
    .from("buchungen_kzv")
    .upsert(row, { onConflict: "mandant_id,beds24_id" })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 200 })
}
