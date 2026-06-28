import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { abgleichAnalyseSchema } from "@/lib/validations/foto-analyse"

type Context = { params: Promise<{ id: string }> }

// Übernahme erfolgt referenziert (Foto + Index in dessen ki_analyse.schaeden),
// damit der Vorschlag serverseitig aus der gespeicherten Analyse kommt und
// idempotent markiert werden kann (kein Doppelanlegen nach Reload).
const schema = z.object({
  fotoId: z.string().uuid(),
  index: z.number().int().min(0),
  // Optionaler Override des automatisch (aus Übergabe-Richtung) gesetzten Kostenträgers.
  kostentraeger: z.enum(["vermieter", "mieter", "versicherung", "weg"]).optional(),
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
 * Freitext-Beschreibung landet im Verlauf (kein Titelfeld an vorgaenge).
 *
 * Kostenträger automatisch aus Übergabe-Richtung: Auszug→mieter (Verschulden→Kaution),
 * Einzug→vermieter (Bestandsschaden); per `kostentraeger` überschreibbar.
 *
 * Idempotent: der übernommene Vorschlag wird in `vorgang_foto.ki_analyse` mit
 * `uebernommen:true` + `folge_vorgang_id` markiert; erneute Übernahme wird geblockt.
 */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "fotoId/index fehlt oder ungültig." }, { status: 422 })
  }
  const { fotoId, index } = parsed.data

  // Eltern-Vorgang (Übergabe) + Foto mit Analyse laden.
  const { data: parent } = await supabase
    .schema("wimus")
    .from("vorgaenge")
    .select("id, mandant_id, objekt_id, einheit_id, typ")
    .eq("id", id)
    .maybeSingle()
  if (!parent) {
    return NextResponse.json({ error: "Übergabe-Vorgang nicht gefunden" }, { status: 404 })
  }

  const { data: foto } = await supabase
    .schema("wimus")
    .from("vorgang_foto")
    .select("id, ki_analyse")
    .eq("id", fotoId)
    .eq("vorgang_id", id)
    .maybeSingle()
  if (!foto?.ki_analyse) {
    return NextResponse.json({ error: "Foto/Analyse nicht gefunden." }, { status: 404 })
  }

  const analyse = abgleichAnalyseSchema.parse(foto.ki_analyse)
  const s = analyse.schaeden[index]
  if (!s) {
    return NextResponse.json({ error: "Vorschlag-Index ungültig." }, { status: 422 })
  }
  if (s.uebernommen) {
    // Bereits übernommen → kein Doppelanlegen (Dubletten-Block).
    return NextResponse.json(
      { error: "Vorschlag bereits übernommen.", folge_vorgang_id: s.folge_vorgang_id ?? null },
      { status: 409 }
    )
  }

  // Kostenträger automatisch aus Übergabe-Richtung (Override möglich).
  let kostentraeger = parsed.data.kostentraeger ?? null
  if (!kostentraeger) {
    if (parent.typ === "uebergabe") {
      const { data: ueb } = await supabase
        .schema("wimus")
        .from("vorgang_uebergabe")
        .select("richtung")
        .eq("vorgang_id", id)
        .maybeSingle()
      kostentraeger = ueb?.richtung === "einzug" ? "vermieter" : "mieter"
    } else {
      kostentraeger = "mieter"
    }
  }

  const prioritaet = (s.schwere && PRIO_AUS_SCHWERE[s.schwere]) || "normal"

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
      kostentraeger,
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
      schaden_typ: s.schaden_typ,
      schwere: s.schwere,
      festgestellt_am: new Date().toISOString().slice(0, 10),
    })
  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 })
  }

  // 3. Beschreibung + Herkunft im Verlauf (kind & parent).
  const freitext = [s.ort, s.beschreibung].filter(Boolean).join(" – ") || "Schaden"
  await supabase
    .schema("wimus")
    .from("vorgang_verlauf")
    .insert([
      { mandant_id: parent.mandant_id, vorgang_id: kind.id, art: "notiz", notiz: `KI-Übergabeabgleich: ${freitext}` },
      { mandant_id: parent.mandant_id, vorgang_id: parent.id, art: "notiz", notiz: `Folge-Schaden angelegt: ${kind.aktenzeichen ?? kind.id}` },
    ])

  // 4. Idempotenz-Markierung in die Analyse zurückschreiben.
  const schaeden = analyse.schaeden.map((x, i) =>
    i === index ? { ...x, uebernommen: true, folge_vorgang_id: kind.id } : x
  )
  await supabase
    .schema("wimus")
    .from("vorgang_foto")
    .update({ ki_analyse: { ...analyse, schaeden } })
    .eq("id", foto.id)

  return NextResponse.json(
    { id: kind.id, aktenzeichen: kind.aktenzeichen, kostentraeger },
    { status: 201 }
  )
}
