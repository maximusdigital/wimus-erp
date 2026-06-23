import { createServerClient } from "@/lib/supabase/server"
import { einheitLabel, type EinheitRef, type ObjektRef } from "@/types/asset"

export type AssetOptions = {
  objekte: ObjektRef[]
  einheiten: EinheitRef[]
}

/** Auswahllisten (Objekte + Einheiten) für das Asset-Formular laden. */
export async function loadAssetOptions(): Promise<AssetOptions> {
  const supabase = await createServerClient()

  const [objekteRes, einheitenRes] = await Promise.all([
    supabase.from("objekte").select("id, kuerzel, bezeichnung").order("kuerzel"),
    supabase
      .from("einheiten")
      .select("id, objekt_id, verwendungszweck_code, bezeichnung")
      .order("verwendungszweck_code", { nullsFirst: false }),
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

  return { objekte, einheiten }
}
