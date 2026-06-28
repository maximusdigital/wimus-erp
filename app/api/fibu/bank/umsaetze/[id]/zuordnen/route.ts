import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { verteileEinnahme, type ForderungOffen } from "@/lib/fibu/op-abgleich"

type Context = { params: Promise<{ id: string }> }

const schema = z.object({
  ignorieren: z.boolean().optional(),
  mietvertrag_id: z.string().uuid().nullish(),
  objekt_id: z.string().uuid().nullish(),
  einheit_id: z.string().uuid().nullish(),
  forderung_id: z.string().uuid().nullish(),
})

/**
 * Manuelle Zuordnung eines Bank-Umsatzes (Klär-Liste): Vertrag/Objekt/Einheit setzen
 * (match_methode=manuell) oder ignorieren. Mit forderung_id + Einnahme → OP-Abgleich.
 */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 422 })

  const { data: umsatz } = await supabase
    .schema("wimus")
    .from("bank_umsaetze")
    .select("id, betrag, richtung, wertstellung")
    .eq("id", id)
    .maybeSingle()
  if (!umsatz) return NextResponse.json({ error: "Umsatz nicht gefunden." }, { status: 404 })

  if (parsed.data.ignorieren) {
    const { error } = await supabase
      .schema("wimus")
      .from("bank_umsaetze")
      .update({ zuordnung_status: "ignoriert" })
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, zuordnung_status: "ignoriert" }, { status: 200 })
  }

  let forderung_id: string | null = parsed.data.forderung_id ?? null
  let zugeordnet_am: string | null = null

  // OP-Abgleich (FIFO-Kaskade) bei Einnahme: alle offenen Forderungen des Vertrags
  // (bzw. die explizit gewählte) verrechnen; Überzahlung bedient die nächste.
  if (umsatz.richtung === "einnahme" && (parsed.data.mietvertrag_id || forderung_id)) {
    let q = supabase
      .schema("wimus")
      .from("forderungen")
      .select("id, betrag, bezahlt_betrag")
      .eq("forderung_typ", "miete")
      .in("status", ["offen", "teilbezahlt"])
      .order("faellig_am", { ascending: true })
    if (forderung_id) q = q.eq("id", forderung_id)
    else q = q.eq("mietvertrag_id", parsed.data.mietvertrag_id as string)
    const { data: offene } = await q

    const liste: ForderungOffen[] = (offene ?? []).map((f) => ({
      id: f.id,
      betrag: f.betrag ?? 0,
      bezahlt_betrag: f.bezahlt_betrag,
    }))
    if (liste.length > 0) {
      const v = verteileEinnahme(umsatz.betrag, liste)
      for (const a of v.allokationen) {
        await supabase
          .schema("wimus")
          .from("forderungen")
          .update({
            bezahlt_betrag: a.neuer_bezahlt_betrag,
            status: a.neuer_status,
            bezahlt_am: a.neuer_status === "bezahlt" ? umsatz.wertstellung : null,
          })
          .eq("id", a.forderung_id)
      }
      forderung_id = v.allokationen[0]?.forderung_id ?? forderung_id
      zugeordnet_am = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .schema("wimus")
    .from("bank_umsaetze")
    .update({
      mietvertrag_id: parsed.data.mietvertrag_id ?? null,
      objekt_id: parsed.data.objekt_id ?? null,
      einheit_id: parsed.data.einheit_id ?? null,
      match_methode: "manuell",
      match_confidence: 1,
      zuordnung_status: "manuell",
      forderung_id,
      zugeordnet_am: zugeordnet_am ?? new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 200 })
}
