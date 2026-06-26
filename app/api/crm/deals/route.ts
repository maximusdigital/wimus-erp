import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { dealInsertSchema } from "@/lib/validations/crm"
import { fehlendePflichtfelder } from "@/lib/crm/deal"
import type { CustomFieldDefinition } from "@/types/crm"

const SELECT =
  "*, kontakt:kontakte(id, vorname, nachname), organisation:organisationen(id, name), firma:firmen(id, name, kuerzel), stage:crm_pipeline_stages(id, name, ist_gewonnen, ist_verloren, stalled_tage)"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const pipelineId = request.nextUrl.searchParams.get("pipeline_id")
  const firmaId = request.nextUrl.searchParams.get("firma_id")

  let query = supabase.from("crm_deals").select(SELECT).order("created_at", { ascending: false })
  if (pipelineId) query = query.eq("pipeline_id", pipelineId)
  if (firmaId) query = query.eq("firma_id", firmaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandant_id = await activeMandantId()
  if (!mandant_id) {
    return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })
  }

  const json = await request.json().catch(() => null)
  const parsed = dealInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  // Pflicht-Custom-Fields prüfen (Spec 0003 60_tests).
  const { data: defs } = await supabase
    .from("crm_custom_field_definitionen")
    .select("*")
    .eq("entitaet", "deal")
  const fehlen = fehlendePflichtfelder(
    (defs ?? []) as CustomFieldDefinition[],
    parsed.data.custom_values,
    { entitaet: "deal", pipelineId: parsed.data.pipeline_id }
  )
  if (fehlen.length > 0) {
    return NextResponse.json(
      { error: `Pflichtfelder fehlen: ${fehlen.join(", ")}` },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_deals")
    .insert({ ...parsed.data, mandant_id })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
