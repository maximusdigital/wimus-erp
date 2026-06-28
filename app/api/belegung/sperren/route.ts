import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { BELEGUNG_GRUND } from "@/lib/belegung/verfuegbarkeit"

const schema = z.object({
  einheit_id: z.string().uuid(),
  von: z.string().min(8),
  bis: z.string().min(8).optional().nullable(),
  grund: z.enum(BELEGUNG_GRUND),
  notiz: z.string().optional().nullable(),
})

/** Sperren (optional je Einheit). */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  let q = supabase
    .schema("wimus")
    .from("belegung_sperren")
    .select("id, einheit_id, von, bis, grund, notiz, beds24_geblockt, einheit:einheiten(verwendungszweck_code, bezeichnung)")
    .order("von", { ascending: false })
  const einheitId = request.nextUrl.searchParams.get("einheit_id")
  if (einheitId) q = q.eq("einheit_id", einheitId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "einheit_id/von/grund erforderlich." }, { status: 422 })
  }

  const { data, error } = await supabase
    .schema("wimus")
    .from("belegung_sperren")
    .insert({
      mandant_id: active.id,
      einheit_id: parsed.data.einheit_id,
      von: parsed.data.von,
      bis: parsed.data.bis || null,
      grund: parsed.data.grund,
      notiz: parsed.data.notiz || null,
    })
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
