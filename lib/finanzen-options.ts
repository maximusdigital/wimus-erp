import { createServerClient } from "@/lib/supabase/server"
import { kontaktName } from "@/types/kontakt"
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
      .schema("wimus")
      .from("mietvertraege")
      .select(
        "id, vertragstyp, mietbeginn, einheit:einheiten(verwendungszweck_code, objekt:objekte(kuerzel)), mieter:kontakte(vorname, nachname, firmenname)"
      )
      .order("mietbeginn", { nullsFirst: false }),
    supabase
      .schema("wimus")
      .from("kontakte")
      .select("id, vorname, nachname, firmenname")
      .order("nachname", { nullsFirst: false }),
  ])

  type VRow = {
    id: string
    vertragstyp: string | null
    einheit: {
      verwendungszweck_code: string | null
      objekt: { kuerzel: string | null } | null
    } | null
    mieter: {
      vorname: string | null
      nachname: string | null
      firmenname: string | null
    } | null
  }

  const vertraege: VertragOption[] = (
    (vertraegeRes.data ?? []) as unknown as VRow[]
  ).map((v) => {
    const kontext = [
      v.einheit?.objekt?.kuerzel,
      v.einheit?.verwendungszweck_code,
      v.mieter ? kontaktName(v.mieter) : null,
    ]
      .filter(Boolean)
      .join(" · ")
    return { id: v.id, label: kontext || v.vertragstyp || "Vertrag" }
  })

  const kontakte = (kontakteRes.data ?? []) as KontaktRef[]

  return { vertraege, kontakte }
}
