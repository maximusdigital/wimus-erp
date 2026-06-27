import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string }> }

// Ein KI-Schadensvorschlag (aus dem Vorher/Nachher-Abgleich).
const schema = z.object({
  ort: z.string().default(""),
  beschreibung: z.string().default(""),
  schaden_typ: z
    .enum(["boden", "wand", "sanitaer", "elektro", "moebel", "fenster", "sonstiges"])
    .nullish()
    .transform((v) => v ?? null),
  schwere: z
    .enum(["bagatell", "mittel", "gross", "grossschaden"])
    .nullish()
    .transform((v) => v ?? null),
})

// Schwere → Vorgangs-Priorität (DB-CHECK: niedrig/normal/hoch/notfall).
const PRIO_AUS_SCHWERE: Record<string, string> = {
  bagatell: "niedrig",
  mittel: "normal",
  gross: "hoch",
  grossschaden: "notfall",
}

/**
 * Übernimmt einen KI-Schadensvorschlag (Übergabe-Abgleich) als Folge-Vorgang.
 *
 * Ein Übergabe-Vorgang trägt Typ `uebergabe` (1:1 vorgang_uebergabe); ein Schaden
 * ist daher ein EIGENER Vorgang `typ=schaden` (+ 1:1 vorgang_schaden). Die
 * Freitext-Beschreibung (Ort/Beschreibung) landet im Verlauf (kein Titelfeld an
 * vorgaenge). Objekt/Einheit werden vom Übergabe-Vorgang übernommen.
 */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Schadensvorschlag." }, { status: 422 })
  }

  const { data: parent } = await supabase
    .schema("wimus")
    .from("vorgaenge")
    .select("id, mandant_id, objekt_id, einheit_id, aktenzeichen")
    .eq("id", id)
    .maybeSingle()
  if (!parent) {
    return NextResponse.json({ error: "Übergabe-Vorgang nicht gefunden" }, { status: 404 })
  }

  const { ort, beschreibung, schaden_typ, schwere } = parsed.data
  const prioritaet = (schwere && PRIO_AUS_SCHWERE[schwere]) || "normal"

  // 1. Folge-Vorgang typ=schaden (Auto-Aktenzeichen via Trigger).
  const { data: kind, error: e1 } = await supabase
    .schema("wimus")
    .from("vorgaenge")
    .insert({
      mandant_id: parent.mandant_id,
      objekt_id: parent.objekt_id,
      einheit_id: parent.einheit_id,
      typ: "schaden",
      prioritaet,
      status: "offen",
      kostentraeger: "mieter", // Übergabe-Auszug → Kaution; bei Bedarf am Vorgang änderbar.
    })
    .select("id, aktenzeichen")
    .single()
  if (e1 || !kind) {
    return NextResponse.json({ error: e1?.message ?? "Anlage fehlgeschlagen." }, { status: 500 })
  }

  // 2. Typ-Zusatz vorgang_schaden (1:1).
  const { error: e2 } = await supabase
    .schema("wimus")
    .from("vorgang_schaden")
    .insert({
      vorgang_id: kind.id,
      mandant_id: parent.mandant_id,
      schaden_typ,
      schwere,
      festgestellt_am: new Date().toISOString().slice(0, 10),
    })
  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 })
  }

  // 3. Beschreibung + Herkunft im Verlauf (kind & parent) festhalten.
  const freitext = [ort, beschreibung].filter(Boolean).join(" – ") || "Schaden"
  await supabase
    .schema("wimus")
    .from("vorgang_verlauf")
    .insert([
      {
        mandant_id: parent.mandant_id,
        vorgang_id: kind.id,
        art: "notiz",
        notiz: `KI-Übergabeabgleich: ${freitext}`,
      },
      {
        mandant_id: parent.mandant_id,
        vorgang_id: parent.id,
        art: "notiz",
        notiz: `Folge-Schaden angelegt: ${kind.aktenzeichen ?? kind.id}`,
      },
    ])

  return NextResponse.json(
    { id: kind.id, aktenzeichen: kind.aktenzeichen },
    { status: 201 }
  )
}
