import { createServerClient } from "@/lib/supabase/server"
import { BelegungCockpit, type EinheitOption, type SperreRow } from "@/components/belegung/belegung-cockpit"

export const metadata = { title: "Belegung – Verfügbarkeit & Sperren" }

export default async function BelegungPage() {
  const supabase = await createServerClient()

  const [{ data: einheitenRaw }, { data: sperrenRaw }] = await Promise.all([
    supabase
      .schema("wimus")
      .from("einheiten")
      .select("id, verwendungszweck_code, bezeichnung, objekt:objekte(kuerzel)")
      .order("verwendungszweck_code", { ascending: true })
      .limit(1000),
    supabase
      .schema("wimus")
      .from("belegung_sperren")
      .select("id, einheit_id, von, bis, grund, notiz, beds24_geblockt, einheit:einheiten(verwendungszweck_code, bezeichnung)")
      .order("von", { ascending: false }),
  ])

  const einheiten: EinheitOption[] = (einheitenRaw ?? []).map((e) => {
    const kuerzel = (e as { objekt?: { kuerzel: string | null } | { kuerzel: string | null }[] | null }).objekt
    const ok = Array.isArray(kuerzel) ? kuerzel[0]?.kuerzel : kuerzel?.kuerzel
    const code = e.verwendungszweck_code || e.bezeichnung || e.id.slice(0, 8)
    return { id: e.id, label: ok ? `${ok} · ${code}` : (code ?? e.id) }
  })

  const sperren = (sperrenRaw ?? []) as unknown as SperreRow[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Belegung</h1>
        <p className="text-muted-foreground text-sm">
          Quellenübergreifende Verfügbarkeit (KZV-Buchungen · Mietverträge · Sperren) + manuelle Sperren.
        </p>
      </div>
      <BelegungCockpit einheiten={einheiten} sperren={sperren} />
    </div>
  )
}
