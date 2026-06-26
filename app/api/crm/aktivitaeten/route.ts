import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { aktivitaetInsertSchema } from "@/lib/validations/crm"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const dealId = request.nextUrl.searchParams.get("deal_id")
  const offen = request.nextUrl.searchParams.get("offen")

  let query = supabase
    .from("crm_deal_aktivitaeten")
    .select("*")
    .order("faellig_am", { ascending: true, nullsFirst: false })
  if (dealId) query = query.eq("deal_id", dealId)
  if (offen === "1") query = query.eq("erledigt", false)

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
  const parsed = aktivitaetInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_deal_aktivitaeten")
    .insert({ ...parsed.data, mandant_id })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
