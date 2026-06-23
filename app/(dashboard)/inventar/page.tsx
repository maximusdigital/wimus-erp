import Link from "next/link"
import { Package, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AssetKarte } from "@/components/assets/asset-karte"
import { AssetTabelle } from "@/components/assets/asset-tabelle"
import type { AssetMitRelationen } from "@/types/asset"

export const metadata = {
  title: "Inventar",
}

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

export default async function InventarPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; einheit?: string; typ?: string }>
}) {
  const { objekt, einheit, typ } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from("asset_register")
    .select(SELECT)
    .order("bezeichnung", { ascending: true })

  if (objekt) query = query.eq("objekt_id", objekt)
  if (einheit) query = query.eq("einheit_id", einheit)
  if (typ) query = query.eq("typ", typ)

  const { data, error } = await query
  const assets = (data ?? []) as unknown as AssetMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventar</h1>
          <p className="text-muted-foreground text-sm">
            {assets.length} {assets.length === 1 ? "Asset" : "Assets"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/inventar/neu" />}>
            <Plus />
            <span>Neues Asset</span>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Package className="size-6" />
          </div>
          <div>
            <p className="font-medium">Kein Inventar</p>
            <p className="text-muted-foreground text-sm">
              Lege das erste Asset an und verknüpfe es mit Objekt oder Einheit.
            </p>
          </div>
          <Button render={<Link href="/inventar/neu" />} variant="outline">
            <Plus />
            <span>Asset anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <AssetTabelle assets={assets} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {assets.map((a) => (
              <AssetKarte key={a.id} asset={a} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
