import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { isPreviewNoAuth } from "@/lib/dev/preview"

/**
 * Admin-Gate (Modul 010, Stufe 0). EINZIGER Weg, Admin-Zugriff zu prüfen.
 *
 * NAHTLOS-REGEL: In Stufe 1 wird die Prüfung intern auf `hatRecht('berechtigungen', …)`
 * umgestellt — die Aufrufstellen (`requireAdmin`/`requireAdminApi`/`istAdmin`) bleiben
 * unverändert. NIE inline `rolle === 'superadmin'` prüfen; immer über diesen Wrapper.
 *
 * Basis: DB-Funktion `wimus.ist_admin()` (superadmin|mandant_admin, zeitlich gültig),
 * aufgerufen im Auth-Kontext des Nutzers (RLS-Client). Preview-Modus (PREVIEW_NO_AUTH)
 * gilt als Admin — konsistent zum Dashboard-Auth-Bypass.
 */
export async function istAdmin(): Promise<boolean> {
  if (isPreviewNoAuth()) return true
  const supabase = await createServerClient()
  const { data, error } = await supabase.rpc("ist_admin")
  if (error) return false
  return data === true
}

/** Für Server-Components/Seiten: bei Nicht-Admin Redirect aufs Dashboard. */
export async function requireAdmin(): Promise<void> {
  if (!(await istAdmin())) redirect("/")
}

/**
 * Für API-Route-Handler: liefert eine 403-Response, wenn kein Admin, sonst null.
 * Nutzung:  const denied = await requireAdminApi(); if (denied) return denied
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await istAdmin()) return null
  return NextResponse.json({ error: "Kein Admin-Zugriff." }, { status: 403 })
}

/**
 * Anti-Lockout (Spec H2): ein Admin darf sich NICHT selbst deaktivieren.
 * Reine Prüfung (testbar). true = die Aktion würde den eigenen Zugang sperren.
 */
export function istSelbstDeaktivierung(
  zielBenutzerId: string,
  eigeneAuthId: string | null | undefined,
  neuAktiv: boolean | null | undefined,
): boolean {
  return neuAktiv === false && !!eigeneAuthId && zielBenutzerId === eigeneAuthId
}
