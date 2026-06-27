import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { claudeZaehlerstand, claudeUebergabeAbgleich } from "@/lib/integrations/claude"
import {
  zaehlerAnalyseSchema,
  abgleichAnalyseSchema,
} from "@/lib/validations/foto-analyse"
import { kiStatusAusConfidence } from "@/lib/ops/confidence"

type Context = { params: Promise<{ id: string }> }

const schema = z.object({
  modus: z.enum(["zaehler", "abgleich"]),
  // Für modus=zaehler: das konkrete Foto, das gelesen werden soll.
  fotoId: z.string().uuid().optional(),
})

/** Öffentliche Storage-URL serverseitig → data:image/…;base64,… (für Claude Vision). */
async function urlZuDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Foto nicht ladbar (${res.status}).`)
  const mime = res.headers.get("content-type") ?? "image/jpeg"
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:${mime};base64,${buf.toString("base64")}`
}

/**
 * KI-Bildanalyse eines Vorgangs (Claude Vision):
 *  - modus=zaehler   → liest ein Zählerstand-Foto (kritisch: nie auto).
 *  - modus=abgleich  → vergleicht Vorher/Nachher → Schadensvorschläge.
 * Ergebnis + Confidence + Routing-Status landen an vorgang_foto.
 */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "modus fehlt/ungültig." }, { status: 422 })
  }

  const { data: vorgang } = await supabase
    .schema("wimus")
    .from("vorgaenge")
    .select("id, typ")
    .eq("id", id)
    .maybeSingle()
  if (!vorgang) {
    return NextResponse.json({ error: "Vorgang nicht gefunden" }, { status: 404 })
  }

  try {
    if (parsed.data.modus === "zaehler") {
      if (!parsed.data.fotoId) {
        return NextResponse.json({ error: "fotoId fehlt." }, { status: 422 })
      }
      const { data: foto } = await supabase
        .schema("wimus")
        .from("vorgang_foto")
        .select("id, url")
        .eq("id", parsed.data.fotoId)
        .eq("vorgang_id", id)
        .maybeSingle()
      if (!foto?.url) {
        return NextResponse.json({ error: "Foto nicht gefunden." }, { status: 404 })
      }

      const dataUrl = await urlZuDataUrl(foto.url)
      const roh = await claudeZaehlerstand([dataUrl])
      const analyse = zaehlerAnalyseSchema.parse(roh)
      // Zählerstand → Abrechnung ist kritisch → nie auto.
      const status = kiStatusAusConfidence(analyse.confidence, true)

      const { error } = await supabase
        .schema("wimus")
        .from("vorgang_foto")
        .update({
          ki_analyse: analyse,
          ki_confidence: analyse.confidence,
          ki_status: status,
          ki_analysiert_am: new Date().toISOString(),
        })
        .eq("id", foto.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Bei Übergaben die erkannten Stände best-effort in vorgang_uebergabe spiegeln.
      if (vorgang.typ === "uebergabe") {
        const { data: ueb } = await supabase
          .schema("wimus")
          .from("vorgang_uebergabe")
          .select("vorgang_id, zaehlerstaende")
          .eq("vorgang_id", id)
          .maybeSingle()
        if (ueb) {
          const bestand = (ueb.zaehlerstaende ?? {}) as Record<string, unknown>
          await supabase
            .schema("wimus")
            .from("vorgang_uebergabe")
            .update({
              zaehlerstaende: {
                ...bestand,
                ki: { zaehler: analyse.zaehler, confidence: analyse.confidence, am: new Date().toISOString() },
              },
            })
            .eq("vorgang_id", id)
        }
      }

      return NextResponse.json({ modus: "zaehler", status, analyse }, { status: 200 })
    }

    // modus = abgleich
    const { data: fotos } = await supabase
      .schema("wimus")
      .from("vorgang_foto")
      .select("id, phase, url, aufgenommen_am")
      .eq("vorgang_id", id)
      .in("phase", ["vorher", "nachher"])
      .order("aufgenommen_am", { ascending: true })

    const vorher = (fotos ?? []).filter((f) => f.phase === "vorher" && f.url)
    const nachher = (fotos ?? []).filter((f) => f.phase === "nachher" && f.url)
    if (vorher.length === 0 || nachher.length === 0) {
      return NextResponse.json(
        { error: "Abgleich braucht je mindestens ein Vorher- und ein Nachher-Foto." },
        { status: 422 }
      )
    }

    const [vorherData, nachherData] = await Promise.all([
      Promise.all(vorher.map((f) => urlZuDataUrl(f.url as string))),
      Promise.all(nachher.map((f) => urlZuDataUrl(f.url as string))),
    ])
    const roh = await claudeUebergabeAbgleich(vorherData, nachherData)
    const analyse = abgleichAnalyseSchema.parse(roh)
    // Schaden → Kaution/Forderung ist kritisch → nie auto.
    const status = kiStatusAusConfidence(analyse.confidence, true)

    // Ergebnis am jüngsten Nachher-Foto (Träger) ablegen.
    const traeger = nachher[nachher.length - 1]
    const { error } = await supabase
      .schema("wimus")
      .from("vorgang_foto")
      .update({
        ki_analyse: analyse,
        ki_confidence: analyse.confidence,
        ki_status: status,
        ki_analysiert_am: new Date().toISOString(),
      })
      .eq("id", traeger.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ modus: "abgleich", status, analyse, traegerFotoId: traeger.id }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "KI-Analyse fehlgeschlagen."
    // Fehlender Token o. ä. → 503 (Dienst nicht verfügbar) statt generischem 500.
    const code = /ANTHROPIC_TOKEN/.test(msg) ? 503 : 502
    return NextResponse.json({ error: msg }, { status: code })
  }
}
