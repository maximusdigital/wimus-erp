import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getFeed, getFeedFor } from "@/lib/historie/feed"
import type { BezugTyp } from "@/lib/historie/types"

const BEZUG_TYPEN: BezugTyp[] = [
  "kontakt", "mieter", "einheit", "objekt", "vorgang", "organisation", "mietvertrag", "buchung",
]

/**
 * GET /api/historie
 *  - ohne bezug_typ/bezug_id → zentraler Feed (optional ?modul= / ?typ=)
 *  - mit bezug_typ+bezug_id  → dezentraler Feed (?inkl=1 = inkl. untergeordnete)
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const supabase = await createServerClient()

  const bezugTyp = sp.get("bezug_typ")
  const bezugId = sp.get("bezug_id")
  if (bezugTyp && bezugId) {
    if (!BEZUG_TYPEN.includes(bezugTyp as BezugTyp)) {
      return NextResponse.json({ error: "Ungültiger bezug_typ." }, { status: 400 })
    }
    const data = await getFeedFor(supabase, bezugTyp as BezugTyp, bezugId, {
      inklUntergeordnete: sp.get("inkl") === "1",
      limit: 100,
    })
    return NextResponse.json(data)
  }

  const data = await getFeed(supabase, {
    modul: sp.get("modul") ?? undefined,
    typ: sp.get("typ") ?? undefined,
    limit: Number(sp.get("limit") ?? 100),
  })
  return NextResponse.json(data)
}
