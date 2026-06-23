import { createServerClient } from "@/lib/supabase/server"
import type { KontaktRef } from "@/types/vertrag"

export type BuchungEinheitOption = {
  id: string
  label: string
  objekt_id: string | null
}

export type BuchungOptions = {
  einheiten: BuchungEinheitOption[]
  kontakte: KontaktRef[]
}

/** Auswahllisten für das Buchungs-Formular laden. */
export async function loadBuchungOptions(): Promise<BuchungOptions> {
  const supabase = await createServerClient()

  const [einheitenRes, kontakteRes] = await Promise.all([
    supabase
      .from("einheiten")
      .select("id, objekt_id, verwendungszweck_code, bezeichnung")
      .order("verwendungszweck_code", { nullsFirst: false }),
    supabase
      .from("kontakte")
      .select("id, typ, vorname, nachname, firma")
      .order("nachname", { nullsFirst: false }),
  ])

  const einheiten: BuchungEinheitOption[] = (
    (einheitenRes.data ?? []) as {
      id: string
      objekt_id: string | null
      verwendungszweck_code: string | null
      bezeichnung: string | null
    }[]
  ).map((e) => ({
    id: e.id,
    label: e.verwendungszweck_code ?? e.bezeichnung ?? "Einheit",
    objekt_id: e.objekt_id,
  }))

  const kontakte = (kontakteRes.data ?? []) as KontaktRef[]

  return { einheiten, kontakte }
}
