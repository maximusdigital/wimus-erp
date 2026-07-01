import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"
import { getUserMandanten } from "@/lib/mandanten"
import { benutzerCreateSchema } from "@/lib/validations/benutzer"

export const runtime = "nodejs"

/**
 * Benutzer-Liste (Modul 010, Stufe 0). Admin-only (requireAdminApi). RLS-Client →
 * nur Benutzer der eigenen Mandanten (mandant_isolation), also KEIN Service-Role-
 * Cross-Mandant-Leak. (Anlegen siehe POST unten.)
 */
export async function GET() {
  const denied = await requireAdminApi()
  if (denied) return denied

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .schema("wimus")
    .from("benutzer")
    .select("id, email, vorname, nachname, aktiv, mfa_aktiv, benutzer_rollen(rolle_id)")
    .order("nachname", { nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * Benutzer anlegen (Stufe 0). Admin legt an, Nutzer setzt sein Passwort selbst.
 * KEIN Trigger auf auth.users (real verifiziert) → die Route legt die
 * wimus.benutzer-Zeile SELBST an. Ablauf mit Service-Role (nur serverseitig):
 *   1. auth.admin.createUser (email_confirm:false) → sofort existent.
 *   2. wimus.benutzer-Insert (id = auth-user-id, mandant_id, …). Scheitert er →
 *      Rollback des auth-Users (deleteUser), damit kein auth.users-Waise bleibt.
 *   3. Best-effort Einladung (Recovery-Link) → der Nutzer setzt sein Passwort.
 *      Mail-Fehler bricht das Anlegen NICHT ab (Response kennzeichnet den Stand).
 * Rollen werden NICHT vergeben (Stufe 1).
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const parsed = benutzerCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 },
    )
  }
  const { email, vorname, nachname, mandant_id } = parsed.data

  // Nur einen Mandanten zuweisen, den der anlegende Admin selbst hat (Service-Role
  // umgeht RLS → hier explizit prüfen, kein Cross-Mandant-Anlegen).
  const erlaubt = await getUserMandanten()
  if (!erlaubt.some((m) => m.id === mandant_id)) {
    return NextResponse.json({ error: "Mandant nicht erlaubt." }, { status: 403 })
  }

  const admin = createAdminClient()

  // 1. Auth-User anlegen.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
  })
  if (createErr || !created?.user) {
    const dup = /exist|registered|already|duplicate/i.test(createErr?.message ?? "")
    return NextResponse.json(
      { error: dup ? "E-Mail ist bereits vergeben." : (createErr?.message ?? "Anlegen fehlgeschlagen.") },
      { status: dup ? 409 : 500 },
    )
  }
  const uid = created.user.id

  // 2. wimus.benutzer-Zeile anlegen (kein Trigger). Bei Fehler: auth-User zurückrollen.
  const { error: insertErr } = await admin
    .schema("wimus")
    .from("benutzer")
    .insert({ id: uid, mandant_id, email, vorname: vorname || null, nachname: nachname || null })
  if (insertErr) {
    await admin.auth.admin.deleteUser(uid).catch(() => {})
    const dup = insertErr.code === "23505"
    return NextResponse.json(
      { error: dup ? "Benutzer existiert bereits." : insertErr.message },
      { status: dup ? 409 : 500 },
    )
  }

  // 3. Best-effort: Passwort-Setz-Mail (Recovery-Link). Fehler blockiert NICHT.
  let einladungVersendet = true
  try {
    const { error: linkErr } = await admin.auth.admin.generateLink({ type: "recovery", email })
    if (linkErr) einladungVersendet = false
  } catch {
    einladungVersendet = false
  }

  return NextResponse.json({ id: uid, einladung_versendet: einladungVersendet }, { status: 201 })
}
