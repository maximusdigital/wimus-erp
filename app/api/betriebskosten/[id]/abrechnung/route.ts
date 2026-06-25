import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { ladeAbrechnungslauf, periodeRange } from "@/lib/betriebskosten-run"

export const runtime = "nodejs"

/**
 * Abrechnung erzeugen: rechnet serverseitig neu und schreibt je Mietvertrag
 * eine Zeile in bk_abrechnungen (Status entwurf). Idempotent: vorhandene
 * Entwürfe der gleichen Mietverträge + Periode werden zuerst entfernt.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { period } = (await request.json().catch(() => ({}))) as {
    period?: string
  }

  const supabase = await createServerClient()
  const active = await getActiveMandant(await getUserMandanten())
  if (!active) {
    return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })
  }

  const lauf = await ladeAbrechnungslauf(supabase, id, period)
  if (!lauf) {
    return NextResponse.json({ error: "Abrechnungseinheit nicht gefunden." }, { status: 404 })
  }
  if (lauf.positionen.length === 0) {
    return NextResponse.json(
      { error: "Keine Kostenpositionen für diese Periode." },
      { status: 422 }
    )
  }

  const { von, bis } = periodeRange(period)

  // Nur Zeilen mit Mietvertrag lassen sich in bk_abrechnungen speichern.
  const rows = lauf.ergebnis.zeilen
    .map((z) => {
      const m = lauf.mitgliedById.get(z.id)
      if (!m?.mietvertrag_id) return null
      return {
        mandant_id: active.id,
        objekt_id: lauf.ae.objekt_id,
        einheit_id: m.einheit_id,
        mietvertrag_id: m.mietvertrag_id,
        typ: "vorauszahlung",
        periode_von: von,
        periode_bis: bis,
        vorauszahlung_gesamt: z.vorauszahlung,
        kosten_gesamt: z.kostenAnteil,
        saldo: z.saldo,
        nebenkostenspiegel: z.positionen,
        status: "entwurf",
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Keine Mitglieder mit Mietvertrag – Abrechnung nicht speicherbar." },
      { status: 422 }
    )
  }

  // Vorherige Entwürfe der gleichen Mietverträge + Periode entfernen (idempotent).
  const mietvertragIds = rows.map((r) => r.mietvertrag_id)
  let del = supabase
    .from("bk_abrechnungen")
    .delete()
    .in("mietvertrag_id", mietvertragIds)
    .eq("status", "entwurf")
  if (von) del = del.eq("periode_von", von)
  await del

  const { data, error } = await supabase
    .from("bk_abrechnungen")
    .insert(rows)
    .select("id")
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, anzahl: data?.length ?? 0 }, { status: 201 })
}
