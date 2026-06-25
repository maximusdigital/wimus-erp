import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { kontaktInsertSchema } from "@/lib/validations/kontakt"
import { readIdList, reconcileVertragRelation } from "@/lib/relations"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  // Rollen-Filter: ?rolle=ist_mieter etc.
  const rolle = request.nextUrl.searchParams.get("rolle")

  let query = supabase
    .schema("wimus")
    .from("kontakte")
    .select("*")
    .order("nachname", { nullsFirst: false })
    .order("firmenname", { nullsFirst: false })

  if (rolle) {
    query = query.eq(rolle, true)
  }

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
  const vertragIds = readIdList(json, "vertrag_ids")
  const parsed = kontaktInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .schema("wimus")
    .from("kontakte")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (vertragIds) {
    const relError = await reconcileVertragRelation(
      supabase,
      "mieter_id",
      data.id,
      vertragIds
    )
    if (relError) {
      return NextResponse.json({ error: relError }, { status: 500 })
    }
  }

  return NextResponse.json(data, { status: 201 })
}
