import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { baueExtfExport, type ExportBuchung } from "@/lib/fibu/extf-export"

export const runtime = "nodejs"

/**
 * GET /api/fibu/export?firma_id=&von=&bis=
 * Liefert die FiBu-Buchungen des Zeitraums als DATEV-EXTF-Buchungsstapel (CSV,
 * Windows-1252) zum Download.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const sp = request.nextUrl.searchParams
  const firmaId = sp.get("firma_id") || undefined
  const von = sp.get("von") || `${new Date().getFullYear()}-01-01`
  const bis = sp.get("bis") || `${new Date().getFullYear()}-12-31`

  let query = supabase
    .from("fibu_buchungen")
    .select(
      "datum, soll_konto, haben_konto, betrag_brutto, ust_schluessel, k1, k2, buchungstext, buchungs_id_extern, firma_id, beleg:belege(belegnummer, belegdatum)"
    )
    .gte("datum", von)
    .lte("datum", bis)
    .order("datum", { ascending: true })

  if (firmaId) query = query.eq("firma_id", firmaId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let firma: { name?: string | null; datev_berater_nr?: string | null; datev_mandant_nr?: string | null } | undefined
  if (firmaId) {
    const { data: f } = await supabase
      .from("firmen")
      .select("name, datev_berater_nr, datev_mandant_nr")
      .eq("id", firmaId)
      .maybeSingle()
    firma = f ?? undefined
  }

  const csv = baueExtfExport(
    (data ?? []) as unknown as ExportBuchung[],
    { von, bis },
    firma
  )

  const dateiname = `EXTF_Buchungsstapel_${von}_${bis}.csv`
  // DATEV erwartet Windows-1252; latin1 deckt die deutschen Zeichen ab.
  return new NextResponse(Buffer.from(csv, "latin1"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=windows-1252",
      "Content-Disposition": `attachment; filename="${dateiname}"`,
    },
  })
}
