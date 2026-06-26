import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { customFieldInsertSchema } from "@/lib/validations/crm"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const entitaet = request.nextUrl.searchParams.get("entitaet")

  let query = supabase
    .from("crm_custom_field_definitionen")
    .select("*")
    .order("sortierung", { ascending: true })
  if (entitaet) query = query.eq("entitaet", entitaet)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandant_id = await activeMandantId()
  if (!mandant_id) {
    return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })
  }

  const json = await request.json().catch(() => null)
  const parsed = customFieldInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_custom_field_definitionen")
    .insert({ ...parsed.data, mandant_id })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
