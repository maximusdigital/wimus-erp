import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { buchungAusBeleg } from "@/lib/fibu/buchung"
import { protokolliereBelegVerbucht } from "@/lib/fibu/historie"
import { getAktuellerAkteur } from "@/lib/historie/akteur"
import type { Beleg } from "@/types/beleg"

type Context = { params: Promise<{ id: string }> }

const SELECT = "*, firma:firmen(id, name, kuerzel)"

// Editierbare Belegfelder (Korrektur durch Buchhalter).
const EDIT_FELDER = [
  "belegnummer",
  "belegdatum",
  "lieferant_name",
  "netto",
  "brutto",
  "ust_satz",
  "ust_betrag",
  "soll_konto",
  "steuerschluessel",
  "k1",
  "k2",
  "firma_id",
] as const

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("belege")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  return NextResponse.json(data)
}

/**
 * PATCH: action="freigeben" erzeugt die Buchung (akteur mensch) + status=gebucht;
 * action="ablehnen" → status=abgelehnt; sonst Feldkorrektur am Beleg.
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const body = await request.json().catch(() => null)
  const action: string | undefined = body?.action

  const { data: current } = await supabase
    .from("belege")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (!current) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  }
  const beleg = current as Beleg

  if (action === "ablehnen") {
    const { data, error } = await supabase
      .from("belege")
      .update({ status: "abgelehnt" })
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === "freigeben") {
    if (!beleg.soll_konto) {
      return NextResponse.json(
        { error: "Kein Soll-Konto – bitte zuerst kontieren." },
        { status: 422 }
      )
    }
    const buchung = buchungAusBeleg(beleg, { akteur_typ: "mensch" })
    const { error: bErr } = await supabase.from("fibu_buchungen").insert(buchung)
    if (bErr) {
      const msg =
        bErr.code === "23505"
          ? "Buchung existiert bereits (Dublette)."
          : bErr.message
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    const { data, error } = await supabase
      .from("belege")
      .update({ status: "gebucht", review_flag: false })
      .eq("id", id)
      .select(SELECT)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Historie (Modul 009): Beleg verbucht (Freigabe Mensch) → Aktivität (blockiert nie).
    await protokolliereBelegVerbucht(supabase, beleg.mandant_id, {
      belegId: id,
      betrag: beleg.brutto,
      konto: beleg.soll_konto,
      art: "mensch",
      k1: beleg.k1,
      akteurId: await getAktuellerAkteur(supabase),
    })
    return NextResponse.json(data)
  }

  // Feldkorrektur.
  const patch: Record<string, unknown> = {}
  for (const f of EDIT_FELDER) {
    if (f in (body ?? {})) patch[f] = body[f]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen." }, { status: 422 })
  }

  // Lernender Loop (Spec 0002 §1): geänderte Felder als korrekturen protokollieren.
  const vorher = beleg as unknown as Record<string, unknown>
  const korrekturen = Object.entries(patch)
    .filter(([f, v]) => String(vorher[f] ?? "") !== String(v ?? ""))
    .map(([f, v]) => ({
      mandant_id: beleg.mandant_id,
      beleg_id: id,
      feld: f,
      alt_wert: vorher[f] == null ? null : String(vorher[f]),
      neu_wert: v == null ? null : String(v),
    }))
  if (korrekturen.length > 0) {
    await supabase.from("fibu_korrekturen").insert(korrekturen)
  }

  const { data, error } = await supabase
    .from("belege")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const { error } = await supabase.from("belege").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
