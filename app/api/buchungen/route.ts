import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { buchungInsertSchema } from "@/lib/validations/buchung"
import { ableiteEinheitFelder } from "@/lib/buchung-derive"

const SELECT =
  "*, einheit:einheiten(verwendungszweck_code, bezeichnung, objekt_id, objekt:objekte(kuerzel)), gast:kontakte(vorname, nachname, firmenname)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = request.nextUrl

  let query = supabase
    .schema("wimus")
    .from("buchungen")
    .select(SELECT)
    .order("checkin", { ascending: false, nullsFirst: false })

  for (const key of ["einheit", "gast"] as const) {
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

  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) {
    return NextResponse.json(
      { error: "Kein aktiver Mandant gefunden." },
      { status: 400 }
    )
  }

  const json = await request.json().catch(() => null)
  const parsed = buchungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const abgeleitet = await ableiteEinheitFelder(supabase, parsed.data)

  const { data, error } = await supabase
    .schema("wimus")
    .from("buchungen")
    .insert({ ...parsed.data, ...abgeleitet, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
