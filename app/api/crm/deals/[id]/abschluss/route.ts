import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { dealAbschlussSchema } from "@/lib/validations/crm"

type Context = { params: Promise<{ id: string }> }

/** Deal abschließen: gewonnen oder verloren (+ Grund Pflicht bei verloren). */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = dealAbschlussSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const patch = {
    status: parsed.data.status,
    verloren_grund_id: parsed.data.status === "verloren" ? parsed.data.verloren_grund_id : null,
    abgeschlossen_am: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("crm_deals")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(data)
}
