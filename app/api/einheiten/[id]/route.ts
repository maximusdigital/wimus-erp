import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { einheitInsertSchema } from "@/lib/validations/einheit"
import { readIdList, reconcileVertragRelation } from "@/lib/relations"

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("einheiten")
    .select("*, objekte(kuerzel, bezeichnung)")
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
  const vertragIds = readIdList(json, "vertrag_ids")
  const parsed = einheitInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  // mandant_id wird nicht verändert; RLS erlaubt Update nur für eigene Mandanten.
  const { data, error } = await supabase
    .from("einheiten")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  if (vertragIds) {
    const relError = await reconcileVertragRelation(
      supabase,
      "einheit_id",
      id,
      vertragIds
    )
    if (relError) {
      return NextResponse.json({ error: relError }, { status: 500 })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const { error } = await supabase.from("einheiten").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
