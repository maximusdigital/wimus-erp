import { NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { requireAdminApi } from "@/lib/berechtigungen/istAdmin"

export const runtime = "nodejs"

/**
 * Benutzer-Liste (Modul 010, Stufe 0). Admin-only (requireAdminApi). RLS-Client →
 * nur Benutzer der eigenen Mandanten (mandant_isolation), also KEIN Service-Role-
 * Cross-Mandant-Leak. Anlegen (POST) ist bewusst NICHT gebaut (Auth-Admin-Weg
 * ungeklärt → geparkt im Report).
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
