import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { feststellungInsertSchema } from "@/lib/validations/feststellung"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const firmaId = request.nextUrl.searchParams.get("firma_id")

  let query = supabase
    .from("feststellungen")
    .select("*, firma:firmen(id, name, kuerzel)")
    .order("created_at", { ascending: false })
  if (firmaId) query = query.eq("firma_id", firmaId)

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
  const parsed = feststellungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("feststellungen")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
