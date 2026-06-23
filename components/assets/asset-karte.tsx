import Link from "next/link"
import { Package } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatEUR } from "@/lib/utils/format"
import {
  einheitLabel,
  ASSET_STANDORT_TYP_LABELS,
  ASSET_TYP_LABELS,
  ASSET_ZUSTAND_LABELS,
  ASSET_ZUSTAND_VARIANT,
  type AssetMitRelationen,
} from "@/types/asset"

export function AssetKarte({ asset }: { asset: AssetMitRelationen }) {
  const bezug = [asset.objekt?.kuerzel, einheitLabel(asset.einheit)]
    .filter(Boolean)
    .join(" · ")

  const standort = asset.standort_typ
    ? (ASSET_STANDORT_TYP_LABELS[asset.standort_typ] ?? asset.standort_typ)
    : null

  return (
    <Link href={`/inventar/${asset.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Package className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{asset.bezeichnung}</span>
              {asset.zustand ? (
                <Badge
                  variant={ASSET_ZUSTAND_VARIANT[asset.zustand] ?? "secondary"}
                  className="shrink-0"
                >
                  {ASSET_ZUSTAND_LABELS[asset.zustand] ?? asset.zustand}
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {asset.typ ? (ASSET_TYP_LABELS[asset.typ] ?? asset.typ) : "Asset"}
              {asset.asset_code ? ` · ${asset.asset_code}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {standort ? <span>{standort}</span> : null}
              {bezug ? <span>{bezug}</span> : null}
              {asset.anschaffung_wert != null ? (
                <span className="tabular-nums">
                  {formatEUR(asset.anschaffung_wert)}
                </span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
