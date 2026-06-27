import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type Context = { params: Promise<{ id: string }> }

const BUCKET = "vorgang-fotos"

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  // URL holen, um die Storage-Datei mitzulöschen (best-effort).
  const { data: foto } = await supabase.from("vorgang_foto").select("url").eq("id", id).maybeSingle()

  const { error } = await supabase.from("vorgang_foto").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (foto?.url) {
    const marker = `/${BUCKET}/`
    const idx = foto.url.indexOf(marker)
    if (idx >= 0) {
      const pfad = foto.url.slice(idx + marker.length)
      await createAdminClient().storage.from(BUCKET).remove([pfad]).catch(() => null)
    }
  }

  return new NextResponse(null, { status: 204 })
}
