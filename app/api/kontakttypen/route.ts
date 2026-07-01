import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { activeMandantId } from "@/lib/crm/server"
import { listTypen, createTyp } from "@/lib/felder/typen"

const DIMENSIONEN = ["person", "organisation"] as const

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const giltFuer = request.nextUrl.searchParams.get("gilt_fuer")
  const dim = DIMENSIONEN.includes(giltFuer as (typeof DIMENSIONEN)[number])
    ? (giltFuer as (typeof DIMENSIONEN)[number])
    : undefined
  const typen = await listTypen(supabase, dim)
  return NextResponse.json(typen)
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
  if (!DIMENSIONEN.includes(body.gilt_fuer)) {
    return NextResponse.json({ error: "gilt_fuer muss person|organisation sein." }, { status: 422 })
  }
  const res = await createTyp(supabase, mandant_id, body.gilt_fuer, body.label, body.beschreibung ?? null)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
  return NextResponse.json(res.data, { status: 201 })
}
