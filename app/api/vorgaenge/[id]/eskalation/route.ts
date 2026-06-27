import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string }> }

const schema = z.object({ eskaliert: z.boolean() })

/** Vorgang manuell eskalieren / Eskalation aufheben (+ Verlauf-Eintrag). */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "eskaliert (boolean) fehlt." }, { status: 422 })
  }

  const { data: vorgang } = await supabase
    .from("vorgaenge")
    .select("id, mandant_id, eskaliert")
    .eq("id", id)
    .maybeSingle()
  if (!vorgang) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  const { data, error } = await supabase
    .from("vorgaenge")
    .update({
      eskaliert: parsed.data.eskaliert,
      eskaliert_am: parsed.data.eskaliert ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("id, eskaliert, eskaliert_am")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("vorgang_verlauf").insert({
    mandant_id: vorgang.mandant_id,
    vorgang_id: id,
    art: "eskalation",
    notiz: parsed.data.eskaliert ? "Eskaliert" : "Eskalation aufgehoben",
  })

  return NextResponse.json(data)
}
