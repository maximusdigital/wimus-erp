import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { mitgliedInsertSchema } from "@/lib/validations/abrechnungseinheit"

type Context = { params: Promise<{ id: string }> }

const SELECT =
  "*, einheit:einheiten(verwendungszweck_code, flaeche), mietvertrag:mietvertraege!mietvertrag_id(aktenzeichen)"

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("abrechnungseinheit_mitglieder")
    .select(SELECT)
    .eq("abrechnungseinheit_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = mitgliedInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("abrechnungseinheit_mitglieder")
    .insert({ ...parsed.data, abrechnungseinheit_id: id, aktiv: true })
    .select()
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
