import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { dealStageSchema } from "@/lib/validations/crm"
import { stageUebergang } from "@/lib/crm/stage"
import type { Deal } from "@/types/crm"

type Context = { params: Promise<{ id: string }> }

/** Stage-Wechsel (Kanban-Drag): schreibt Historie + setzt Stage-Timer zurück. */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = dealStageSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data: deal, error: loadErr } = await supabase
    .from("crm_deals")
    .select("id, mandant_id, stage_id, in_stage_seit, status")
    .eq("id", id)
    .maybeSingle()
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 })
  if (!deal) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  const d = deal as Pick<Deal, "id" | "mandant_id" | "stage_id" | "in_stage_seit" | "status">
  if (d.stage_id === parsed.data.stage_id) {
    return NextResponse.json({ ok: true, unchanged: true })
  }

  let uebergang
  try {
    uebergang = stageUebergang(d, parsed.data.stage_id)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stage-Wechsel nicht möglich." },
      { status: 409 }
    )
  }

  const { error: histErr } = await supabase.from("crm_deal_stage_historie").insert({
    mandant_id: d.mandant_id,
    deal_id: d.id,
    ...uebergang.historie,
  })
  if (histErr) return NextResponse.json({ error: histErr.message }, { status: 500 })

  const { data, error } = await supabase
    .from("crm_deals")
    .update(uebergang.patch)
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
