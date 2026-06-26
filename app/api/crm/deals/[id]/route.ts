import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { dealPatchSchema } from "@/lib/validations/crm"

type Context = { params: Promise<{ id: string }> }

const SELECT =
  "*, kontakt:kontakte(id, vorname, nachname), organisation:organisationen(id, name), firma:firmen(id, name, kuerzel), stage:crm_pipeline_stages(id, name, ist_gewonnen, ist_verloren, stalled_tage)"

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("crm_deals")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = dealPatchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_deals")
    .update(parsed.data)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { error } = await supabase.from("crm_deals").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
