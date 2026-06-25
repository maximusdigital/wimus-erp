import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { kostenpositionInsertSchema } from "@/lib/validations/kostenposition"

const SELECT =
  "*, objekt:objekte(kuerzel, stadt), bk_art:bk_arten(bezeichnung, kategorie, standard_schluessel), abrechnungseinheit:abrechnungseinheiten(id, bezeichnung)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = request.nextUrl

  let query = supabase
    .from("kostenverteilung_positionen")
    .select(SELECT)
    .order("created_at", { ascending: false })

  const objekt = searchParams.get("objekt")
  if (objekt) query = query.eq("objekt_id", objekt)
  const ae = searchParams.get("abrechnungseinheit")
  if (ae) query = query.eq("abrechnungseinheit_id", ae)
  const period = searchParams.get("period")
  if (period) query = query.eq("abrechnungsperiode", period)

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
  const parsed = kostenpositionInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("kostenverteilung_positionen")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
