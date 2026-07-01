import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { firmaInsertSchema } from "@/lib/validations/firma"

export const runtime = "nodejs"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const { id } = await params
  const json = await request.json().catch(() => null)
  const parsed = firmaInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }
  if (parsed.data.mutter_firma_id === id) {
    return NextResponse.json(
      { error: "Eine Firma kann nicht ihre eigene Mutter sein." },
      { status: 422 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("firmen")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
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
  const supabase = createAdminClient()

  const { count } = await supabase
    .schema("wimus")
    .from("projekte")
    .select("id", { count: "exact", head: true })
    .eq("firma_id", id)
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Firma ist Projekten zugeordnet – diese zuerst umhängen." },
      { status: 409 }
    )
  }

  const { error } = await supabase.schema("wimus").from("firmen").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
