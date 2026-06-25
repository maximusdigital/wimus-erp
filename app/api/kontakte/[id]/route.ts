import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { kontaktInsertSchema } from "@/lib/validations/kontakt"
import { readIdList, reconcileVertragRelation } from "@/lib/relations"

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("kontakte")
    .select("*")
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
  const parsed = kontaktInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  // mandant_id wird nicht verändert; RLS erlaubt Update nur für eigene Mandanten.
  const { data, error } = await supabase
    .schema("wimus")
    .from("kontakte")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  if (vertragIds) {
    const relError = await reconcileVertragRelation(
      supabase,
      "mieter_id",
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

  const { error } = await supabase
    .schema("wimus")
    .from("kontakte")
    .delete()
    .eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
