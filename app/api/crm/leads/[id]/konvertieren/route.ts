import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { activeMandantId } from "@/lib/crm/server"
import { leadKonvertierenSchema } from "@/lib/validations/crm"
import { konvertiereLead } from "@/lib/crm/lead"
import type { Lead } from "@/types/crm"

type Context = { params: Promise<{ id: string }> }

/** Lead → Deal: legt Deal an, markiert Lead als konvertiert (+ deal_id). */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()
  const mandant_id = await activeMandantId()
  if (!mandant_id) {
    return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })
  }

  const json = await request.json().catch(() => null)
  const parsed = leadKonvertierenSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { data: lead, error: loadErr } = await supabase
    .from("crm_leads")
    .select("id, status, deal_id, kontakt_id, organisation_id, custom_values")
    .eq("id", id)
    .maybeSingle()
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 })
  if (!lead) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  // 1. Deal-Payload bauen (wirft, wenn Lead nicht konvertierbar).
  let dealPayload
  try {
    dealPayload = konvertiereLead(lead as Lead, parsed.data, "").deal
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Konvertierung nicht möglich." },
      { status: 409 }
    )
  }

  // 2. Deal anlegen.
  const { data: deal, error: dealErr } = await supabase
    .from("crm_deals")
    .insert({ ...dealPayload, mandant_id })
    .select("id")
    .single()
  if (dealErr) return NextResponse.json({ error: dealErr.message }, { status: 500 })

  // 3. Lead patchen.
  const { error: patchErr } = await supabase
    .from("crm_leads")
    .update({ status: "konvertiert", deal_id: deal.id })
    .eq("id", id)
  if (patchErr) return NextResponse.json({ error: patchErr.message }, { status: 500 })

  return NextResponse.json({ deal_id: deal.id }, { status: 201 })
}
