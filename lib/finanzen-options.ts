import { createServerClient } from "@/lib/supabase/server"
import type { KontaktRef } from "@/types/vertrag"

export type VertragOption = { id: string; label: string }

export type FinanzenOptions = {
  vertraege: VertragOption[]
  kontakte: KontaktRef[]
}

/** Auswahllisten für Mahnungs-/Kautions-Formulare laden. */
export async function loadFinanzenOptions(): Promise<FinanzenOptions> {
  const supabase = await createServerClient()

  const [vertraegeRes, kontakteRes] = await Promise.all([
    supabase
      .from("vertraege")
      .select("id, vertragsnummer")
      .order("vertragsnummer", { nullsFirst: false }),
    supabase
      .from("kontakte")
      .select("id, typ, vorname, nachname, firma")
      .order("nachname", { nullsFirst: false }),
  ])

  const vertraege: VertragOption[] = (
    (vertraegeRes.data ?? []) as { id: string; vertragsnummer: string | null }[]
  ).map((v) => ({ id: v.id, label: v.vertragsnummer ?? "Vertrag" }))

  const kontakte = (kontakteRes.data ?? []) as KontaktRef[]

  return { vertraege, kontakte }
}
