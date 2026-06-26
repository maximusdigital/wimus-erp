import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { beteiligungInsertSchema } from "@/lib/validations/gesellschafter"

const SELECT = "*, firma:firmen(id, name, kuerzel)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const gesellschafterId = request.nextUrl.searchParams.get("gesellschafter_id")

  let query = supabase
    .from("beteiligungen")
    .select(SELECT)
    .order("gueltig_ab", { ascending: false })

  if (gesellschafterId) query = query.eq("gesellschafter_id", gesellschafterId)

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
  const parsed = beteiligungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("beteiligungen")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select(SELECT)
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
