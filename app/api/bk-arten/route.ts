import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { bkArtInsertSchema } from "@/lib/validations/bk-art"

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("bk_arten")
    .select("*")
    .order("bezeichnung", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  // Aktiven Mandanten ermitteln (RLS erlaubt Insert nur für eigene Mandanten).
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) {
    return NextResponse.json(
      { error: "Kein aktiver Mandant gefunden." },
      { status: 400 }
    )
  }

  const json = await request.json().catch(() => null)
  const parsed = bkArtInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("bk_arten")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "code existiert bereits" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
