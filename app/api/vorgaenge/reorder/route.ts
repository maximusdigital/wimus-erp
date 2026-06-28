import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"

const schema = z.object({ ids: z.array(z.string().uuid()).max(500) })

/**
 * Manuelle Board-Reihenfolge der Plantafel persistieren: setzt board_sort = Position
 * (0..n) für die übergebenen Vorgangs-IDs (eine Spalte/ein Status). RLS scoped.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "ids fehlt/ungültig." }, { status: 422 })
  }

  const results = await Promise.all(
    parsed.data.ids.map((id, i) =>
      supabase.schema("wimus").from("vorgaenge").update({ board_sort: i }).eq("id", id)
    )
  )
  const err = results.find((r) => r.error)?.error
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: parsed.data.ids.length }, { status: 200 })
}
