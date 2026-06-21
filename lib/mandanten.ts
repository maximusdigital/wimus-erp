import { cookies } from "next/headers"

import { createServerClient } from "@/lib/supabase/server"
import type { Mandant } from "@/types/mandant"

/** Cookie-Name für den aktiven Mandanten. */
export const MANDANT_COOKIE = "wimus_mandant_id"

/**
 * Mandanten des aktuellen Users.
 * RLS sorgt dafür, dass nur zugeordnete Mandanten zurückkommen (user_mandanten).
 */
export async function getUserMandanten(): Promise<Mandant[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("mandanten")
    .select("id, name, kuerzel, farbe")
    .order("name")

  return (data as Mandant[] | null) ?? []
}

/**
 * Aktiver Mandant aus dem Cookie – Fallback: erster verfügbarer Mandant.
 */
export async function getActiveMandant(
  mandanten: Mandant[]
): Promise<Mandant | null> {
  if (mandanten.length === 0) return null

  const cookieStore = await cookies()
  const id = cookieStore.get(MANDANT_COOKIE)?.value

  return mandanten.find((m) => m.id === id) ?? mandanten[0]
}
