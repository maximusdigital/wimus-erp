import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { mahnungInsertSchema } from "@/lib/validations/mahnung"

type Context = { params: Promise<{ id: string }> }

const SELECT =
  "*, vertrag:vertraege(vertragsnummer), mieter:kontakte(vorname, nachname, firma)"

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("mahnungen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = mahnungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const gesamt =
    (parsed.data.hauptforderung ?? 0) +
    (parsed.data.zinsen ?? 0) +
    (parsed.data.gebuehren ?? 0)

  // mandant_id wird nicht verändert; RLS erlaubt Update nur für eigene Mandanten.
  const { data, error } = await supabase
    .from("mahnungen")
    .update({ ...parsed.data, gesamt })
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const { error } = await supabase.from("mahnungen").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
