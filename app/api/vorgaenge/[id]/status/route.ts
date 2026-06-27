import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { statusUebergang } from "@/lib/ops/status"

type Context = { params: Promise<{ id: string }> }

/**
 * Statuswechsel eines Vorgangs (Engine): prüft den erlaubten Übergang, setzt den
 * Status und schreibt einen vorgang_verlauf-Eintrag (best-effort).
 */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const nachStatus = json?.status
  const reaktivieren = json?.reaktivieren === true
  if (typeof nachStatus !== "string") {
    return NextResponse.json({ error: "status fehlt." }, { status: 422 })
  }

  const { data: vorgang, error: loadErr } = await supabase
    .from("vorgaenge")
    .select("id, mandant_id, status")
    .eq("id", id)
    .maybeSingle()
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 })
  if (!vorgang) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  let uebergang
  try {
    uebergang = statusUebergang(vorgang.status, nachStatus, { reaktivieren })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Statuswechsel nicht möglich." },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("vorgaenge")
    .update(uebergang.patch)
    .eq("id", id)
    .select("id, status")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Verlauf-Eintrag (best-effort — bricht den Statuswechsel nicht).
  await supabase.from("vorgang_verlauf").insert({
    mandant_id: vorgang.mandant_id,
    vorgang_id: id,
    art: "status",
    von_status: uebergang.verlauf.von_status,
    nach_status: uebergang.verlauf.nach_status,
  })

  return NextResponse.json(data)
}
