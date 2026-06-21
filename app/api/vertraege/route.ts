import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { vertragInsertSchema } from "@/lib/validations/vertrag"

const SELECT =
  "*, objekt:objekte(kuerzel, bezeichnung), einheit:einheiten(verwendungszweck_code, bezeichnung), mieter:kontakte(vorname, nachname, firma)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = request.nextUrl

  let query = supabase
    .from("vertraege")
    .select(SELECT)
    .order("beginn", { nullsFirst: false })

  for (const key of ["objekt", "einheit", "mieter"] as const) {
    const value = searchParams.get(key)
    if (value) query = query.eq(`${key}_id`, value)
  }
  const status = searchParams.get("status")
  if (status) query = query.eq("status", status)

  const { data, error } = await query
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
  const parsed = vertragInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("vertraege")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
