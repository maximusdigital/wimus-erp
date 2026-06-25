import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getWorkspaceId } from "@/lib/firmen"
import { firmaInsertSchema } from "@/lib/validations/firma"

export const runtime = "nodejs"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("firmen")
    .select("id, name, kuerzel, rechtsform, mutter_firma_id, ci_farbe_primary, aktiv")
    .order("name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null)
  const parsed = firmaInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }
  const workspaceId = await getWorkspaceId()
  if (!workspaceId) {
    return NextResponse.json({ error: "Kein Workspace gefunden." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("firmen")
    .insert({ ...parsed.data, workspace_id: workspaceId })
    .select("id")
    .single()
  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
