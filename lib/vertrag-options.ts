import { createServerClient } from "@/lib/supabase/server"
import { DEMO_OBJEKTE } from "@/lib/dev/demo-objekte"
import { DEMO_EINHEITEN } from "@/lib/dev/demo-einheiten"
import { DEMO_KONTAKTE } from "@/lib/dev/demo-kontakte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import type { EinheitRef, KontaktRef, ObjektRef } from "@/types/vertrag"

export type VertragOptions = {
  objekte: ObjektRef[]
  einheiten: EinheitRef[]
  kontakte: KontaktRef[]
}

/** Auswahllisten für das Vertrags-Formular laden (mit Vorschau-Fallback). */
export async function loadVertragOptions(): Promise<VertragOptions> {
  const supabase = await createServerClient()

  const [objekteRes, einheitenRes, kontakteRes] = await Promise.all([
    supabase.from("objekte").select("id, kuerzel, bezeichnung").order("kuerzel"),
    supabase
      .from("einheiten")
      .select("id, objekt_id, verwendungszweck_code, bezeichnung")
      .order("verwendungszweck_code", { nullsFirst: false }),
    supabase
      .from("kontakte")
      .select("id, typ, vorname, nachname, firma")
      .order("nachname", { nullsFirst: false }),
  ])

  let objekte = (objekteRes.data ?? []) as ObjektRef[]
  let einheiten = (einheitenRes.data ?? []) as EinheitRef[]
  let kontakte = (kontakteRes.data ?? []) as KontaktRef[]

  if (isPreviewNoAuth()) {
    if (objekte.length === 0) {
      objekte = DEMO_OBJEKTE.map((o) => ({
        id: o.id,
        kuerzel: o.kuerzel,
        bezeichnung: o.kuerzel,
      }))
    }
    if (einheiten.length === 0) {
      einheiten = DEMO_EINHEITEN.map((e) => ({
        id: e.id,
        objekt_id: e.objekt_id,
        verwendungszweck_code: e.verwendungszweck_code,
        bezeichnung: e.bezeichnung,
      }))
    }
    if (kontakte.length === 0) {
      kontakte = DEMO_KONTAKTE.map((k) => ({
        id: k.id,
        typ: k.typ,
        vorname: k.vorname,
        nachname: k.nachname,
        firma: k.firma,
      }))
    }
  }

  return { objekte, einheiten, kontakte }
}
