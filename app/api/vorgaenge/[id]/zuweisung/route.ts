import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string }> }

const optUuid = z
  .string()
  .uuid()
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() !== "" ? v : null))

const schema = z.object({
  rolle: z.enum(["verantwortlich", "ausfuehrend", "extern"]).default("ausfuehrend"),
  akteur_id: optUuid,
  organisation_id: optUuid,
  kontakt_id: optUuid,
})

/** Zuweisung zu einem Vorgang anlegen (intern Akteur ODER extern Org/Kontakt). */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 }
    )
  }
  if (!parsed.data.akteur_id && !parsed.data.organisation_id && !parsed.data.kontakt_id) {
    return NextResponse.json({ error: "Akteur oder Organisation/Kontakt wählen." }, { status: 422 })
  }

  const { data: vorgang } = await supabase
    .from("vorgaenge")
    .select("id, mandant_id")
    .eq("id", id)
    .maybeSingle()
  if (!vorgang) return NextResponse.json({ error: "Vorgang nicht gefunden" }, { status: 404 })

  const extern = !!parsed.data.organisation_id || !!parsed.data.kontakt_id
  const { data, error } = await supabase
    .from("vorgang_zuweisung")
    .insert({
      ...parsed.data,
      vorgang_id: id,
      mandant_id: vorgang.mandant_id,
      status: extern ? "beauftragt" : "vorgeschlagen",
      auftrag_versendet_am: extern ? new Date().toISOString() : null,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("vorgang_verlauf").insert({
    mandant_id: vorgang.mandant_id,
    vorgang_id: id,
    art: "zuweisung",
    notiz: extern ? "Extern beauftragt" : "Intern zugewiesen",
  })

  return NextResponse.json(data, { status: 201 })
}
