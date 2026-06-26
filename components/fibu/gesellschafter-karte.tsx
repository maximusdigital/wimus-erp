import Link from "next/link"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  GESELLSCHAFTER_TYP_LABELS,
  type Gesellschafter,
} from "@/types/gesellschafter"

export function GesellschafterKarte({
  gesellschafter,
}: {
  gesellschafter: Gesellschafter
}) {
  const g = gesellschafter
  return (
    <Link href={`/fibu/gesellschafter/${g.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{g.name}</span>
            <StatusBadge status={g.aktiv ? "aktiv" : "inaktiv"}>
              {g.aktiv ? "Aktiv" : "Inaktiv"}
            </StatusBadge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{GESELLSCHAFTER_TYP_LABELS[g.typ] ?? g.typ}</span>
            {g.steuerliche_id ? <span>St-ID: {g.steuerliche_id}</span> : null}
            {g.stadt ? <span>{[g.plz, g.stadt].filter(Boolean).join(" ")}</span> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
