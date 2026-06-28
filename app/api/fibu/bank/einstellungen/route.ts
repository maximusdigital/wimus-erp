import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"

const schema = z.object({
  auto_schwelle: z.number().min(0).max(1),
  pruefen_schwelle: z.number().min(0).max(1),
  name_min: z.number().min(0).max(1),
})

const DEFAULTS = { auto_schwelle: 0.9, pruefen_schwelle: 0.75, name_min: 0.82 }

/** Confidence-Schwellen des aktiven Mandanten (Default, falls keine Zeile). */
export async function GET() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("bank_einstellungen")
    .select("auto_schwelle, pruefen_schwelle, name_min")
    .maybeSingle()
  return NextResponse.json(
    data
      ? {
          auto_schwelle: Number(data.auto_schwelle),
          pruefen_schwelle: Number(data.pruefen_schwelle),
          name_min: Number(data.name_min),
        }
      : DEFAULTS
  )
}

/** Schwellen setzen (Upsert je Mandant). */
export async function PUT(request: NextRequest) {
  const supabase = await createServerClient()
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Schwellen (0..1)." }, { status: 422 })

  const { data, error } = await supabase
    .schema("wimus")
    .from("bank_einstellungen")
    .upsert({ mandant_id: active.id, ...parsed.data }, { onConflict: "mandant_id" })
    .select("auto_schwelle, pruefen_schwelle, name_min")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
