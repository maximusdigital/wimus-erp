import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { leadVerwerfenSchema } from "@/lib/validations/crm"
import { verwerfeLead } from "@/lib/crm/lead"

type Context = { params: Promise<{ id: string }> }

/** Lead verwerfen (+ Grund Pflicht). Bleibt erhalten, raus aus aktiver Inbox. */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = leadVerwerfenSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  let patch
  try {
    patch = verwerfeLead(parsed.data.verworfen_grund)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verwerfen nicht möglich." },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_leads")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(data)
}
