import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { forderungInsertSchema } from "@/lib/validations/forderung"

const SELECT =
  "*, kontakt:kontakte!kontakt_id(vorname, nachname, firmenname), mietvertrag:mietvertraege(aktenzeichen)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = request.nextUrl

  let query = supabase
    .from("forderungen")
    .select(SELECT)
    .order("faellig_am", { ascending: true, nullsFirst: false })

  const kontakt = searchParams.get("kontakt")
  if (kontakt) query = query.eq("kontakt_id", kontakt)
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
  const parsed = forderungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("forderungen")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
