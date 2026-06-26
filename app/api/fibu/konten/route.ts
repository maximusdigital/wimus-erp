import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { fibuKontoInsertSchema } from "@/lib/validations/fibu-konto"

const SELECT = "*, firma:firmen(id, name, kuerzel)"

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("fibu_konten")
    .select(SELECT)
    .order("kontonummer", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) {
    return NextResponse.json(
      { error: "Kein aktiver Mandant gefunden." },
      { status: 400 }
    )
  }

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
    .insert({ ...parsed.data, mandant_id: active.id })
    .select(SELECT)
    .single()

  if (error) {
    const status = error.code === "23505" ? 409 : 500
    const msg =
      error.code === "23505"
        ? "Kontonummer für diese Firma bereits vergeben."
        : error.message
    return NextResponse.json({ error: msg }, { status })
  }
  return NextResponse.json(data, { status: 201 })
}
