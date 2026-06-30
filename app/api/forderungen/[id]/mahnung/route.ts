import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { naechsteMahnung } from "@/lib/utils/mahnlauf"
import { protokolliereMahnungVersandt } from "@/lib/fibu/historie"
import { getAktuellerAkteur } from "@/lib/historie/akteur"

type Context = { params: Promise<{ id: string }> }

/**
 * Mahnlauf-Aktion: erzeugt aus einer überfälligen Forderung die nächste
 * Mahnung (5-stufig) und verknüpft sie zurück mit der Forderung.
 */
export async function POST(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: forderung, error: ladeFehler } = await supabase
    .from("forderungen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (ladeFehler) {
    return NextResponse.json({ error: ladeFehler.message }, { status: 500 })
  }
  if (!forderung) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }

  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) {
    return NextResponse.json(
      { error: "Kein aktiver Mandant gefunden." },
      { status: 400 }
    )
  }

  const heute = new Date().toISOString().slice(0, 10)
  const vorschlag = naechsteMahnung(forderung, heute)

  const { data: mahnung, error: insertFehler } = await supabase
    .from("mahnungen")
    .insert({
      mandant_id: active.id,
      mietvertrag_id: forderung.mietvertrag_id ?? null,
      stufe: vorschlag.stufe,
      hauptforderung: vorschlag.hauptforderung,
      zinsen: vorschlag.zinsen,
      gebuehren: vorschlag.gebuehren,
      gesamtforderung: vorschlag.gesamt,
      faellig_am: heute,
      status: "offen",
    })
    .select("id")
    .single()

  if (insertFehler || !mahnung) {
    return NextResponse.json(
      { error: insertFehler?.message ?? "Mahnung konnte nicht erstellt werden." },
      { status: 500 }
    )
  }

  const { error: updateFehler } = await supabase
    .from("forderungen")
    .update({
      mahnstufe: vorschlag.stufe,
      status: "mahnung",
      mahnung_id: mahnung.id,
    })
    .eq("id", id)

  if (updateFehler) {
    return NextResponse.json({ error: updateFehler.message }, { status: 500 })
  }

  // Historie (Modul 009): Mahnung ausgelöst → Aktivität (blockiert nie).
  await protokolliereMahnungVersandt(supabase, active.id, {
    mietvertragId: forderung.mietvertrag_id ?? null,
    mahnstufe: vorschlag.stufe,
    betrag: vorschlag.gesamt,
    forderungId: id,
    akteurId: await getAktuellerAkteur(supabase),
  })

  return NextResponse.json(
    { ok: true, mahnung_id: mahnung.id, stufe: vorschlag.stufe },
    { status: 201 }
  )
}
