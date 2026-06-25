import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { buchungInsertSchema } from "@/lib/validations/buchung"
import { ableiteEinheitFelder } from "@/lib/buchung-derive"

type Context = { params: Promise<{ id: string }> }

const SELECT =
  "*, einheit:einheiten(verwendungszweck_code, bezeichnung, objekt_id, objekt:objekte(kuerzel)), gast:kontakte(vorname, nachname, firmenname)"

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("buchungen")
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
  const parsed = buchungInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const abgeleitet = await ableiteEinheitFelder(supabase, parsed.data)

  // mandant_id wird nicht verändert; RLS erlaubt Update nur für eigene Mandanten.
  const { data, error } = await supabase
    .schema("wimus")
    .from("buchungen")
    .update({ ...parsed.data, ...abgeleitet })
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

  const { error } = await supabase
    .schema("wimus")
    .from("buchungen")
    .delete()
    .eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
