import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string; mid: string }> }

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { mid } = await params
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("abrechnungseinheit_mitglieder")
    .delete()
    .eq("id", mid)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
