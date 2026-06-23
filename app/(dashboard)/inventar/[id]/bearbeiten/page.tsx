import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadAssetOptions } from "@/lib/asset-options"
import { AssetForm } from "@/components/assets/asset-form"
import type { Asset } from "@/types/asset"

export const metadata = {
  title: "Asset bearbeiten",
}

export default async function AssetBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("asset_register")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const asset = data as Asset | null

  if (!asset) {
    notFound()
  }

  const { objekte, einheiten } = await loadAssetOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/inventar/${asset.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Asset
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {asset.bezeichnung} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">Asset-Daten aktualisieren.</p>
      </div>

      <div className="max-w-4xl">
        <AssetForm asset={asset} objekte={objekte} einheiten={einheiten} />
      </div>
    </div>
  )
}
