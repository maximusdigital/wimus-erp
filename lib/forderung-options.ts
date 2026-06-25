import { createServerClient } from "@/lib/supabase/server"
import type { KontaktRef } from "@/types/vertrag"
import type { VertragOption } from "@/components/forderungen/forderung-form"

export type ForderungOptions = {
  kontakte: KontaktRef[]
  vertraege: VertragOption[]
}

/** Auswahllisten für das Forderungs-Formular laden (Kontakte + Verträge). */
export async function loadForderungOptions(): Promise<ForderungOptions> {
  const supabase = await createServerClient()

  const [kontakteRes, vertraegeRes] = await Promise.all([
    supabase
      .from("kontakte")
      .select("id, vorname, nachname, firmenname")
      .order("nachname", { nullsFirst: false }),
    supabase
      .from("mietvertraege")
      .select("id, aktenzeichen, einheit_id"),
  ])

  const kontakte = (kontakteRes.data ?? []) as KontaktRef[]

  type VRow = { id: string; aktenzeichen: string | null }
  const vertraege: VertragOption[] = (
    (vertraegeRes.data ?? []) as unknown as VRow[]
  ).map((v) => ({ id: v.id, label: v.aktenzeichen || "Vertrag" }))

  return { kontakte, vertraege }
}
