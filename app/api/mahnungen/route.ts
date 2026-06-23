import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { mahnungInsertSchema } from "@/lib/validations/mahnung"

const SELECT =
  "*, vertrag:vertraege(vertragsnummer), mieter:kontakte(vorname, nachname, firma)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = request.nextUrl

  let query = supabase
    .from("mahnungen")
    .select(SELECT)
    .order("faellig_am", { ascending: false, nullsFirst: false })

  for (const key of ["vertrag", "mieter"] as const) {
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
  const parsed = mahnungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  // Gesamtforderung serverseitig berechnen.
  const gesamt =
    (parsed.data.hauptforderung ?? 0) +
    (parsed.data.zinsen ?? 0) +
    (parsed.data.gebuehren ?? 0)

  const { data, error } = await supabase
    .from("mahnungen")
    .insert({ ...parsed.data, gesamt, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
