import { createServerClient } from "@/lib/supabase/server"
import type { Firma } from "@/types/firma"

/** Firmen (Org-Ebene 2) aus dem wimus-Schema. */
export async function getFirmen(): Promise<Firma[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("firmen")
    .select("id, name, kuerzel, rechtsform")
    .eq("aktiv", true)
    .order("name")
  return (data as Firma[] | null) ?? []
}

/** Erste/aktive Workspace-ID (Org-Ebene 1) – Pflicht-FK für firmen/projekte. */
export async function getWorkspaceId(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}

/** Vollständiger Workspace-Datensatz (Org-Ebene 1) – Einzelzeile. */
export async function getWorkspace(): Promise<Record<string, unknown> | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("workspaces")
    .select(
      "id, name, kuerzel, inhaber, strasse, hausnummer, plz, stadt, telefon, email, website, ci_farbe_primary, logo_url"
    )
    .limit(1)
    .maybeSingle()
  return (data as Record<string, unknown> | null) ?? null
}
