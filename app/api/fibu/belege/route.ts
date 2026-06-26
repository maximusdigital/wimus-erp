import { createHash } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { verarbeiteBeleg } from "@/lib/fibu/beleg-pipeline"
import { buchungAusBeleg } from "@/lib/fibu/buchung"
import { mistralOcr, mistralExtrahiere } from "@/lib/integrations/mistral"
import type { Kontierungsregel } from "@/lib/utils/fibu"
import type { Beleg } from "@/types/beleg"

export const runtime = "nodejs"
export const maxDuration = 60

const SELECT = "*, firma:firmen(id, name, kuerzel)"

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("belege")
    .select(SELECT)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) {
    return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const content: string | null = body?.content ?? null
  const dataUrl: string | null = body?.dataUrl ?? null
  const kanal: string = body?.kanal ?? "upload"
  if (!content && !dataUrl) {
    return NextResponse.json(
      { error: "content oder dataUrl erforderlich." },
      { status: 422 }
    )
  }

  // Dublettensicherung über Hash des Rohinhalts.
  const hash = createHash("sha256")
    .update(content ?? dataUrl ?? "")
    .digest("hex")

  // Kontierungsregeln laden.
  const { data: regelnData } = await supabase
    .from("kontierungsregeln")
    .select("id, match, soll_konto, ust_satz, steuerschluessel, prioritaet")
    .eq("aktiv", true)
  const regeln = (regelnData ?? []) as Kontierungsregel[]

  let entwurf
  try {
    entwurf = await verarbeiteBeleg(
      { content, dataUrl },
      { heute: new Date().toISOString().slice(0, 10), regeln },
      { ocr: mistralOcr, extrahiere: mistralExtrahiere }
    )
  } catch (e) {
    return NextResponse.json(
      { error: `Belegerkennung fehlgeschlagen: ${(e as Error).message}` },
      { status: 502 }
    )
  }

  const insert = {
    mandant_id: active.id,
    firma_id: null,
    hash,
    kanal,
    ist_erechnung: entwurf.quelle === "erechnung",
    belegnummer: entwurf.belegnummer,
    belegdatum: entwurf.belegdatum,
    lieferant_name: entwurf.lieferant_name,
    lieferant_ustid: entwurf.lieferant_ustid,
    iban: entwurf.iban,
    gewerk: entwurf.gewerk,
    netto: entwurf.netto,
    brutto: entwurf.brutto,
    ust_satz: entwurf.ust_satz,
    ust_betrag: entwurf.ust_betrag,
    soll_konto: entwurf.soll_konto,
    steuerschluessel: entwurf.steuerschluessel,
    k1: entwurf.k1,
    confidence_ocr: entwurf.confidence_ocr,
    confidence_extraktion: entwurf.confidence_extraktion,
    confidence_kontierung: entwurf.confidence_kontierung,
    review_flag: entwurf.review_flag,
    review_gruende: entwurf.review_gruende,
    status: entwurf.status,
  }

  const { data: belegRow, error } = await supabase
    .from("belege")
    .insert(insert)
    .select(SELECT)
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Beleg bereits vorhanden (Dublette).", code: "dublette" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-Buchung (KI) nur wenn die Pipeline es freigibt.
  if (entwurf.auto_buchbar) {
    const buchung = buchungAusBeleg(belegRow as Beleg, { akteur_typ: "ki" })
    await supabase.from("buchungen").insert(buchung)
  }

  return NextResponse.json(belegRow, { status: 201 })
}
