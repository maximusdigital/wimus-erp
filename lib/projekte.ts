import { cookies } from "next/headers"

import { createServerClient } from "@/lib/supabase/server"
import { orderProjekteTree, type Projekt } from "@/types/projekt"

/** Cookie-Name für das aktive Projekt. */
export const PROJEKT_COOKIE = "wimus_projekt_id"

/**
 * Projekte der Org-Hierarchie aus dem wimus-Schema (V501).
 * In Anzeige-Reihenfolge (Top-Level + Unterprojekte verschachtelt).
 * RLS gibt nur lesbare Projekte zurück.
 */
export async function getProjekte(): Promise<Projekt[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("projekte")
    .select(
      "id, name, kuerzel, typ, parent_projekt_id, ebene, ci_farbe_primary, ci_farbe_secondary"
    )
    .eq("aktiv", true)

  return orderProjekteTree((data as Projekt[] | null) ?? [])
}

/** Aktives Projekt aus dem Cookie – Fallback: erstes Top-Level-Projekt. */
export async function getActiveProjekt(projekte: Projekt[]): Promise<Projekt | null> {
  if (projekte.length === 0) return null

  const cookieStore = await cookies()
  const id = cookieStore.get(PROJEKT_COOKIE)?.value

  return (
    projekte.find((p) => p.id === id) ??
    projekte.find((p) => (p.ebene ?? 0) === 0) ??
    projekte[0]
  )
}
