import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { globaleSuche } from "@/lib/search/global-search"

/**
 * Globale Suche (Modul 006): Fan-out über die Registry, RLS-konform (Server-Client).
 * GET /api/search?q=…  → gerankte, gemischte Treffer.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const q = request.nextUrl.searchParams.get("q") ?? ""
  const results = await globaleSuche(supabase, q)
  return NextResponse.json(results)
}
