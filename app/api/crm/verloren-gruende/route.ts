import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { verlorenGrundInsertSchema } from "@/lib/validations/crm"

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("crm_verloren_gruende")
    .select("*")
    .order("sortierung", { ascending: true })

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
  const parsed = verlorenGrundInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("crm_verloren_gruende")
    .insert({ ...parsed.data, mandant_id })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
