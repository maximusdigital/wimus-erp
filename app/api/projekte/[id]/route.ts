import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { projektInsertSchema } from "@/lib/validations/projekt"

export const runtime = "nodejs"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const { id } = await params
  const json = await request.json().catch(() => null)
  const parsed = projektInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const supabase = createAdminClient()

  // Selbst-Referenz verhindern (Projekt darf nicht sein eigener Parent sein).
  if (parsed.data.parent_projekt_id === id) {
    return NextResponse.json(
      { error: "Ein Projekt kann nicht sein eigenes Unterprojekt sein." },
      { status: 422 }
    )
  }

  let ebene = 0
  if (parsed.data.parent_projekt_id) {
    const { data: parent } = await supabase
      .schema("wimus")
      .from("projekte")
      .select("ebene")
      .eq("id", parsed.data.parent_projekt_id)
      .maybeSingle()
    ebene = ((parent?.ebene as number | null) ?? 0) + 1
  }

  const { data, error } = await supabase
    .schema("wimus")
    .from("projekte")
    .update({ ...parsed.data, ebene })
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

  // Unterprojekte blockieren das Löschen (FK) – sauber zurückmelden.
  const { count } = await supabase
    .schema("wimus")
    .from("projekte")
    .select("id", { count: "exact", head: true })
    .eq("parent_projekt_id", id)
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Projekt hat Unterprojekte – diese zuerst entfernen." },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .schema("wimus")
    .from("projekte")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
