import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { parseGreenApiWebhook } from "@/lib/kommunikation/adapters/whatsapp"
import { persistiereEingehend } from "@/lib/kommunikation/inbox"

/**
 * GreenAPI-Eingangs-Webhook (Modul 007) — eingehende WhatsApp-Nachrichten.
 *
 * GreenAPI POSTet je Event (incomingMessageReceived, Status-Callbacks …) an diese
 * URL. Ablauf: Payload parsen → Instanz über instanceData.idInstance auflösen
 * (→ Mandant + per-Instanz webhook_token) → Token timing-safe prüfen → bei
 * eingehender Nachricht `persistiereEingehend` (gemeinsame Inbox-Wahrheit; löst
 * intern auch die Historie-Aktivität aus). Status-Callbacks werden mit 200 quittiert.
 *
 * Läuft OHNE User-Session → Admin-Client (Service-Role, umgeht RLS); der Mandant
 * wird explizit aus der Instanz gesetzt. Idempotenz/Dublettenschutz über extern_id
 * in persistiereEingehend (Webhook-Retry-fest).
 */
export const runtime = "nodejs"

function tokenOk(provided: string | null, expected: string | null | undefined): boolean {
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ungültiger Payload" }, { status: 400 })
  }
  const p = payload as Record<string, unknown>

  // 1) Instanz aus instanceData.idInstance auflösen.
  const instanceData = (p.instanceData ?? {}) as Record<string, unknown>
  const idInstance = instanceData.idInstance != null ? String(instanceData.idInstance) : null
  if (!idInstance) {
    return NextResponse.json({ error: "idInstance fehlt" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: instanz } = await supabase
    .from("kom_wa_instanzen")
    .select("id, mandant_id, webhook_token, aktiv")
    .eq("green_id_instance", idInstance)
    .maybeSingle()

  if (!instanz || !instanz.aktiv) {
    return NextResponse.json({ error: "Instanz unbekannt oder inaktiv" }, { status: 404 })
  }

  // 2) Webhook-Token prüfen (per Instanz). GreenAPI sendet ihn als Authorization-
  //    Header (optional "Bearer "-Präfix) oder wir akzeptieren ?token=. Fail-closed.
  const auth = request.headers.get("authorization")
  const headerToken = auth ? auth.replace(/^Bearer\s+/i, "").trim() : null
  const provided = headerToken ?? request.nextUrl.searchParams.get("token")
  if (!tokenOk(provided, instanz.webhook_token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 3) Nur eingehende Nachrichten persistieren; Status-Callbacks quittieren.
  const nachricht = parseGreenApiWebhook(p)
  if (!nachricht) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 })
  }

  try {
    const r = await persistiereEingehend(
      supabase,
      { mandant_id: instanz.mandant_id, kanal: "whatsapp", wa_instanz_id: instanz.id },
      nachricht,
    )
    return NextResponse.json({ ok: true, nachricht_id: r.nachricht_id, neu: r.neu }, { status: 200 })
  } catch (e) {
    // Persistenzfehler: 500, damit GreenAPI erneut zustellt (Retry-fest via extern_id).
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Persistenz fehlgeschlagen" },
      { status: 500 },
    )
  }
}
