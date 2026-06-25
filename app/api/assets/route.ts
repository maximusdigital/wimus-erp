import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { assetInsertSchema } from "@/lib/validations/asset"

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = request.nextUrl

  let query = supabase
    .schema("public").from("asset_register")
    .select(SELECT)
    .order("bezeichnung", { ascending: true })

  for (const key of ["objekt", "einheit"] as const) {
    const value = searchParams.get(key)
    if (value) query = query.eq(`${key}_id`, value)
  }
  const typ = searchParams.get("typ")
  if (typ) query = query.eq("typ", typ)

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
  const parsed = assetInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .schema("public").from("asset_register")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "asset_code existiert bereits" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
