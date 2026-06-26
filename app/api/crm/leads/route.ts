import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { leadInsertSchema } from "@/lib/validations/crm"

const SELECT =
  "*, kontakt:kontakte(id, vorname, nachname), organisation:organisationen(id, name)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const status = request.nextUrl.searchParams.get("status")

  let query = supabase.from("crm_leads").select(SELECT).order("created_at", { ascending: false })
  if (status) query = query.eq("status", status)

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
  const parsed = leadInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_leads")
    .insert({ ...parsed.data, mandant_id })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
