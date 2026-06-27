import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { objektTagInsertSchema } from "@/lib/validations/objekt-tag"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const objektId = request.nextUrl.searchParams.get("objekt_id")

  let query = supabase.from("objekt_tags").select("*").order("wert", { ascending: true })
  if (objektId) query = query.eq("objekt_id", objektId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) {
    return NextResponse.json({ error: "Kein aktiver Mandant gefunden." }, { status: 400 })
  }

  const json = await request.json().catch(() => null)
  const parsed = objektTagInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("objekt_tags")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select("*")
    .single()

  if (error) {
    // 23505 = UNIQUE (objekt_id, tag_typ, wert) → Tag existiert bereits.
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
