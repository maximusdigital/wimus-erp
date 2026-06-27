import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type Context = { params: Promise<{ id: string }> }

const BUCKET = "vorgang-fotos"

const schema = z.object({
  phase: z.enum(["vorher", "nachher", "befund", "sonstig"]).default("sonstig"),
  dataUrl: z.string().min(1),
  beschreibung: z.string().optional().nullable(),
})

/** Foto zu einem Vorgang: lädt das Bild nach Supabase Storage + legt vorgang_foto an. */
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params
  const supabase = await createServerClient()

  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "phase/dataUrl fehlt." }, { status: 422 })
  }

  // Data-URL zerlegen → mime + Bytes.
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(parsed.data.dataUrl)
  if (!m) return NextResponse.json({ error: "Ungültige Bilddaten." }, { status: 422 })
  const mime = m[1]
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Nur Bilder erlaubt." }, { status: 422 })
  }
  const bytes = Buffer.from(m[2], "base64")
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg"

  const { data: vorgang } = await supabase
    .from("vorgaenge")
    .select("id, mandant_id")
    .eq("id", id)
    .maybeSingle()
  if (!vorgang) return NextResponse.json({ error: "Vorgang nicht gefunden" }, { status: 404 })

  // Storage (Service-Role): Bucket sicherstellen + hochladen.
  const admin = createAdminClient()
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => null)
  const pfad = `${vorgang.mandant_id}/${id}/${crypto.randomUUID()}.${ext}`
  const up = await admin.storage.from(BUCKET).upload(pfad, bytes, {
    contentType: mime,
    upsert: false,
  })
  if (up.error) {
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${up.error.message}` }, { status: 500 })
  }
  const url = admin.storage.from(BUCKET).getPublicUrl(pfad).data.publicUrl

  const { data, error } = await supabase
    .from("vorgang_foto")
    .insert({
      mandant_id: vorgang.mandant_id,
      vorgang_id: id,
      phase: parsed.data.phase,
      url,
      beschreibung: parsed.data.beschreibung ?? null,
    })
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
