import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { bkArtInsertSchema } from "@/lib/validations/bk-art"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const { id } = await params
  const json = await request.json().catch(() => null)
  const parsed = bkArtInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("bk_arten")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const { id } = await params
  const supabase = await createServerClient()
  const { error } = await supabase.from("bk_arten").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
