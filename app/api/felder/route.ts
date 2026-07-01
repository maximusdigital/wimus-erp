import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { activeMandantId } from "@/lib/crm/server"
import { listDefs, createDef } from "@/lib/felder/definition"
import { FELDTYPEN, FELD_ENTITAETEN, type FieldType } from "@/lib/felder/types"

const FELDTYP_KEYS = FELDTYPEN.map((t) => t.value) as readonly string[]
const ENTITAET_KEYS = FELD_ENTITAETEN.map((e) => e.value) as readonly string[]

export async function GET(request: NextRequest) {
  const entitaet = request.nextUrl.searchParams.get("entitaet")
  if (!entitaet || !ENTITAET_KEYS.includes(entitaet)) {
    return NextResponse.json({ error: "Gültige ?entitaet= erforderlich." }, { status: 400 })
  }
  const supabase = await createServerClient()
  const defs = await listDefs(supabase, entitaet)
  return NextResponse.json(defs)
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const supabase = await createServerClient()
  const mandant_id = await activeMandantId()
  if (!mandant_id) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.label !== "string") {
    return NextResponse.json({ error: "label ist Pflicht." }, { status: 422 })
  }
  if (!ENTITAET_KEYS.includes(body.entitaet)) {
    return NextResponse.json({ error: "Ungültige entitaet." }, { status: 422 })
  }
  if (!FELDTYP_KEYS.includes(body.typ)) {
    return NextResponse.json({ error: "Ungültiger Feldtyp." }, { status: 422 })
  }

  const res = await createDef(supabase, mandant_id, {
    entitaet: body.entitaet,
    label: body.label,
    typ: body.typ as FieldType,
    pflicht: !!body.pflicht,
    gruppe: body.gruppe ?? null,
    optionen: Array.isArray(body.optionen) ? body.optionen.map(String) : undefined,
  })
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
  return NextResponse.json(res.data, { status: 201 })
}
