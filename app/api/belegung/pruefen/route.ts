import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { ladeBelegungen } from "@/lib/belegung/laden"
import { istVerfuegbar } from "@/lib/belegung/verfuegbarkeit"

const schema = z.object({
  einheit_id: z.string().uuid(),
  von: z.string().min(8),
  bis: z.string().min(8).nullish(),
  ausser: z
    .object({ quelle: z.enum(["buchung", "mietvertrag", "sperre"]), id: z.string() })
    .nullish(),
})

/**
 * Verfügbarkeitsprüfung einer Einheit für [von, bis) über alle drei Belegungsquellen.
 * Warnt nur (kein Hard-Block) — der Aufrufer entscheidet. RLS über den Server-Client.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "einheit_id/von erforderlich." }, { status: 422 })
  }
  const { einheit_id, von, bis, ausser } = parsed.data

  const belegungen = await ladeBelegungen(supabase, einheit_id)
  const ergebnis = istVerfuegbar(von, bis ?? null, belegungen, ausser ?? undefined)
  return NextResponse.json(ergebnis, { status: 200 })
}
