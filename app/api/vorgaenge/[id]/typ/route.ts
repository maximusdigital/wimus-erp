import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { TYP_TABELLE, typSchemas } from "@/lib/validations/vorgang-typ"

type Context = { params: Promise<{ id: string }> }

/** Typ-Zusatzdaten eines Vorgangs lesen (richtet sich nach vorgaenge.typ). */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: vorgang } = await supabase.from("vorgaenge").select("typ").eq("id", id).maybeSingle()
  const tabelle = vorgang?.typ ? TYP_TABELLE[vorgang.typ] : undefined
  if (!tabelle) return NextResponse.json(null)

  const { data, error } = await supabase.from(tabelle).select("*").eq("vorgang_id", id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** Typ-Zusatzdaten upserten (1:1 je Vorgang). */
export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: vorgang } = await supabase
    .from("vorgaenge")
    .select("typ, mandant_id")
    .eq("id", id)
    .maybeSingle()
  if (!vorgang) return NextResponse.json({ error: "Vorgang nicht gefunden" }, { status: 404 })

  const tabelle = vorgang.typ ? TYP_TABELLE[vorgang.typ] : undefined
  const schema = vorgang.typ ? typSchemas[vorgang.typ] : undefined
  if (!tabelle || !schema) {
    return NextResponse.json({ error: "Typ hat keine Zusatzdaten." }, { status: 400 })
  }

  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from(tabelle)
    .upsert(
      { vorgang_id: id, mandant_id: vorgang.mandant_id, ...(parsed.data as Record<string, unknown>) },
      { onConflict: "vorgang_id" }
    )
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
