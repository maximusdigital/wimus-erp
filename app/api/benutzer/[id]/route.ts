import { NextRequest, NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAdminApi, istSelbstDeaktivierung } from "@/lib/berechtigungen/istAdmin"
import { benutzerUpdateSchema } from "@/lib/validations/benutzer"

export const runtime = "nodejs"

/**
 * Benutzer-Stammdaten/Aktiv-Status ändern (Modul 010, Stufe 0). Admin-only.
 * - Guard: requireAdminApi (403 bei Nicht-Admin).
 * - Anti-Lockout (Spec H2): Selbst-Deaktivierung wird geblockt (409).
 * - RLS-Client (KEIN Service-Role) → Update nur auf Benutzer der eigenen Mandanten.
 * - Rollen werden hier NICHT geändert (Vergabe = Stufe 1).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const { id } = await params
  const parsed = benutzerUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierung fehlgeschlagen", issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Anti-Lockout: kein Selbst-Deaktivieren.
  if (istSelbstDeaktivierung(id, user?.id, parsed.data.aktiv)) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst deaktivieren." },
      { status: 409 },
    )
  }

  // Nur gesetzte Felder patchen.
  const patch: Record<string, unknown> = {}
  if (parsed.data.vorname !== undefined) patch.vorname = parsed.data.vorname || null
  if (parsed.data.nachname !== undefined) patch.nachname = parsed.data.nachname || null
  if (parsed.data.aktiv !== undefined) patch.aktiv = parsed.data.aktiv
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen." }, { status: 422 })
  }

  const { data, error } = await supabase
    .schema("wimus")
    .from("benutzer")
    .update(patch)
    .eq("id", id)
    .select("id")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 })
  return NextResponse.json(data)
}
