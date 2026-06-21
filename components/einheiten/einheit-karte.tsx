import Link from "next/link"
import { DoorOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  EINHEITSTYP_LABELS,
  EINHEIT_STATUS_LABELS,
  EINHEIT_STATUS_VARIANT,
  type EinheitMitObjekt,
} from "@/types/einheit"

export function EinheitKarte({ einheit }: { einheit: EinheitMitObjekt }) {
  return (
    <Link href={`/einheiten/${einheit.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <DoorOpen className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {einheit.verwendungszweck_code ?? einheit.bezeichnung ?? "Einheit"}
              </span>
              <Badge
                variant={EINHEIT_STATUS_VARIANT[einheit.status] ?? "secondary"}
              >
                {EINHEIT_STATUS_LABELS[einheit.status] ?? einheit.status}
              </Badge>
            </div>
            <p className="truncate text-sm">{einheit.bezeichnung ?? "–"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {einheit.objekte?.kuerzel ?? "–"}
              {einheit.lage ? ` · ${einheit.lage}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {einheit.einheitstyp
                  ? (EINHEITSTYP_LABELS[einheit.einheitstyp] ??
                    einheit.einheitstyp)
                  : "–"}
              </span>
              <span>
                {einheit.wohnflaeche_qm != null
                  ? `${einheit.wohnflaeche_qm} m²`
                  : "– m²"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
