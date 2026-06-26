import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { buchungAusBeleg } from "@/lib/fibu/buchung"
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
    const { error: bErr } = await supabase.from("buchungen").insert(buchung)
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
