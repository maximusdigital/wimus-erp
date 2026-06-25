import { createServerClient } from "@/lib/supabase/server"
import { DEMO_EINHEITEN } from "@/lib/dev/demo-einheiten"
import { DEMO_OBJEKTE } from "@/lib/dev/demo-objekte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import type { EinheitZuordnung } from "@/components/objekte/objekt-form"

/** Alle Einheiten als Zuordnungs-Optionen für das Objekt-Formular laden. */
export async function loadEinheitZuordnungen(): Promise<EinheitZuordnung[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("einheiten")
    .select("id, objekt_id, verwendungszweck_code, bezeichnung, objekte(kuerzel)")
    .order("verwendungszweck_code", { nullsFirst: false })

  type Row = {
    id: string
    objekt_id: string | null
    verwendungszweck_code: string | null
    bezeichnung: string | null
    objekte: { kuerzel: string | null } | null
  }

  let rows = (data ?? []) as unknown as Row[]

  if (isPreviewNoAuth() && rows.length === 0) {
    const kuerzelById = new Map(DEMO_OBJEKTE.map((o) => [o.id, o.kuerzel]))
    rows = DEMO_EINHEITEN.map((e) => ({
      id: e.id,
      objekt_id: e.objekt_id,
      verwendungszweck_code: e.verwendungszweck_code,
      bezeichnung: e.bezeichnung,
      objekte: { kuerzel: kuerzelById.get(e.objekt_id) ?? null },
    }))
  }

  return rows.map((r) => ({
    id: r.id,
    objekt_id: r.objekt_id,
    label: r.verwendungszweck_code ?? r.bezeichnung ?? "Einheit",
    objektKuerzel: r.objekte?.kuerzel ?? null,
  }))
}
