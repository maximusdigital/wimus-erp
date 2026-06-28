import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"

const schema = z.object({
  bezeichnung: z.string().min(1),
  iban: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
  inhaber: z.string().optional().nullable(),
})

/** Bankkonten des Mandanten (für Import-Zuordnung). */
export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("bank_konten")
    .select("*")
    .order("bezeichnung", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "bezeichnung fehlt." }, { status: 422 })

  const { data, error } = await supabase
    .schema("wimus")
    .from("bank_konten")
    .insert({
      mandant_id: active.id,
      bezeichnung: parsed.data.bezeichnung,
      iban: parsed.data.iban ?? null,
      bank: parsed.data.bank ?? null,
      inhaber: parsed.data.inhaber ?? null,
    })
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
