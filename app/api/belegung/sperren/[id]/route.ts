import { NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string }> }

/** Sperre löschen. */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { error } = await supabase.schema("wimus").from("belegung_sperren").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
