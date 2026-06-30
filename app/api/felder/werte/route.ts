import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { listDefs } from "@/lib/felder/definition"
import { getWerte, setWert } from "@/lib/felder/value"
import { FELD_ENTITAETEN } from "@/lib/felder/types"

const ENTITAET_KEYS = FELD_ENTITAETEN.map((e) => e.value) as readonly string[]

/**
 * Custom-Field-Werte einer Entitäts-Zeile (Detailseite, Modul 008 Stufe 2).
 * GET ?entitaet=&id= → { definitionen, werte } (Definitionen-Loader + getWerte).
 * PUT { entitaet, id, def_id, wert } → setWert (idempotenter Upsert, server-only).
 * Schema/RLS/mandant kommen über den Server-Client bzw. activeMandantId() — nie vom Client.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const entitaet = sp.get("entitaet")
  const id = sp.get("id")
  if (!entitaet || !ENTITAET_KEYS.includes(entitaet)) {
    return NextResponse.json({ error: "Gültige ?entitaet= erforderlich." }, { status: 400 })
  }
  if (!id) return NextResponse.json({ error: "?id= erforderlich." }, { status: 400 })

  const supabase = await createServerClient()
  const [definitionen, werte] = await Promise.all([
    listDefs(supabase, entitaet),
    getWerte(supabase, entitaet, id),
  ])
  return NextResponse.json({ definitionen, werte })
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerClient()
  const mandant_id = await activeMandantId()
  if (!mandant_id) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (
    !body ||
    !ENTITAET_KEYS.includes(body.entitaet) ||
    typeof body.id !== "string" ||
    typeof body.def_id !== "string"
  ) {
    return NextResponse.json({ error: "entitaet/id/def_id erforderlich." }, { status: 422 })
  }

  const res = await setWert(supabase, mandant_id, body.def_id, body.entitaet, body.id, body.wert)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
  return NextResponse.json({ ok: true })
}
