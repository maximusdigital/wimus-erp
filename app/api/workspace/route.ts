import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { getWorkspaceId } from "@/lib/firmen"
import { workspaceUpdateSchema } from "@/lib/validations/workspace"

export const runtime = "nodejs"

/** Den (einzigen) Workspace aktualisieren. */
export async function PATCH(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const json = await request.json().catch(() => null)
  const parsed = workspaceUpdateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const id = await getWorkspaceId()
  if (!id) {
    return NextResponse.json({ error: "Kein Workspace gefunden." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("workspaces")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
