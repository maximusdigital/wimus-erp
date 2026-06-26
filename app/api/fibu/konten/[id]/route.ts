import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { fibuKontoInsertSchema } from "@/lib/validations/fibu-konto"

type Context = { params: Promise<{ id: string }> }

const SELECT = "*, firma:firmen(id, name, kuerzel)"

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("fibu_konten")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = fibuKontoInsertSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("fibu_konten")
    .update(parsed.data)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    const msg =
      error.code === "23505"
        ? "Kontonummer für diese Firma bereits vergeben."
        : error.message
    return NextResponse.json({ error: msg }, { status })
  }
  if (!data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const { error } = await supabase.from("fibu_konten").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
