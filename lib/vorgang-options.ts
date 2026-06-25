import { createServerClient } from "@/lib/supabase/server"
import {
  einheitLabel,
  type EinheitRef,
  type KontaktRef,
  type ObjektRef,
} from "@/types/vorgang"

export type VorgangOptions = {
  objekte: ObjektRef[]
  einheiten: EinheitRef[]
  kontakte: KontaktRef[]
}

/** Auswahllisten (Objekte + Einheiten + Kontakte) für das Vorgangs-Formular laden. */
export async function loadVorgangOptions(): Promise<VorgangOptions> {
  const supabase = await createServerClient()

  const [objekteRes, einheitenRes, kontakteRes] = await Promise.all([
    supabase
      .schema("wimus")
      .from("objekte")
      .select("id, kuerzel, bezeichnung")
      .order("kuerzel"),
    supabase
      .schema("wimus")
      .from("einheiten")
      .select("id, objekt_id, verwendungszweck_code, bezeichnung")
      .order("verwendungszweck_code", { nullsFirst: false }),
    supabase
      .schema("wimus")
      .from("kontakte")
      .select("id, vorname, nachname, firmenname")
      .order("nachname", { nullsFirst: false }),
  ])

  const objekte = (objekteRes.data ?? []) as ObjektRef[]
  const einheiten = (
    (einheitenRes.data ?? []) as {
      id: string
      objekt_id: string
      verwendungszweck_code: string | null
      bezeichnung: string | null
    }[]
  ).map((e) => ({
    id: e.id,
    objekt_id: e.objekt_id,
    label:
      einheitLabel({
        verwendungszweck_code: e.verwendungszweck_code,
        bezeichnung: e.bezeichnung,
      }) ?? "Einheit",
  }))

  const kontakte = (kontakteRes.data ?? []) as KontaktRef[]

  return { objekte, einheiten, kontakte }
}
