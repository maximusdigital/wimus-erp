import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"

const schema = z.object({ muster: z.string().min(1) })

/** Pflegbare Ignorier-Muster (Vorfilter) des Mandanten. */
export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("bank_ignorier_muster")
    .select("id, muster, aktiv")
    .order("created_at", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "muster fehlt." }, { status: 422 })

  const { data, error } = await supabase
    .schema("wimus")
    .from("bank_ignorier_muster")
    .insert({ mandant_id: active.id, muster: parsed.data.muster.trim() })
    .select("id, muster, aktiv")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
