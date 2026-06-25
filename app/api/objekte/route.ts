import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { objektInsertSchema } from "@/lib/validations/objekt"
import { readIdList, reconcileVertragRelation } from "@/lib/relations"

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("objekte")
    .select("*")
    .order("kuerzel")

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
  const einheitIds = readIdList(json, "einheit_ids") ?? []
  const vertragIds = readIdList(json, "vertrag_ids")
  const parsed = objektInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .schema("wimus")
    .from("objekte")
    .insert({ ...parsed.data, mandant_id: active.id })
    .select()
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  // Einheiten-Zuordnung (additiv: ausgewählte Einheiten dem neuen Objekt zuweisen).
  if (einheitIds.length > 0) {
    const { error: zuordnungError } = await supabase
      .from("einheiten")
      .update({ objekt_id: data.id })
      .in("id", einheitIds)
    if (zuordnungError) {
      return NextResponse.json({ error: zuordnungError.message }, { status: 500 })
    }
  }

  // Verträge-Zuordnung abgleichen (objekt_id ist nullable → add/remove).
  if (vertragIds) {
    const relError = await reconcileVertragRelation(
      supabase,
      "objekt_id",
      data.id,
      vertragIds
    )
    if (relError) {
      return NextResponse.json({ error: relError }, { status: 500 })
    }
  }

  return NextResponse.json(data, { status: 201 })
}
