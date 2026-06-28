import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { updateTyp, deleteTyp } from "@/lib/felder/typen"

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Ungültiger Body." }, { status: 422 })

  const res = await updateTyp(supabase, id, {
    label: typeof body.label === "string" ? body.label : undefined,
    beschreibung: body.beschreibung === undefined ? undefined : body.beschreibung,
    sortierung: typeof body.sortierung === "number" ? body.sortierung : undefined,
    aktiv: typeof body.aktiv === "boolean" ? body.aktiv : undefined,
  })
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const res = await deleteTyp(supabase, id)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
  return new NextResponse(null, { status: 204 })
}
