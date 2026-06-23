import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadAssetOptions } from "@/lib/asset-options"
import { AssetForm } from "@/components/assets/asset-form"

export const metadata = {
  title: "Neues Asset",
}

export default async function NeuesAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; einheit?: string }>
}) {
  const { objekt, einheit } = await searchParams
  const { objekte, einheiten } = await loadAssetOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/inventar"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Inventar
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neues Asset
        </h1>
        <p className="text-muted-foreground text-sm">
          Asset erfassen und optional mit Objekt oder Einheit verknüpfen.
        </p>
      </div>

      <div className="max-w-4xl">
        <AssetForm
          objekte={objekte}
          einheiten={einheiten}
          defaultObjektId={objekt}
          defaultEinheitId={einheit}
        />
      </div>
    </div>
  )
}
