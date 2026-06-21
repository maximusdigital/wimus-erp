import { Building2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatAdresse, formatEUR } from "@/lib/utils/format"
import {
  OBJEKTTYP_LABELS,
  OBJEKT_STATUS_LABELS,
  OBJEKT_STATUS_VARIANT,
  type ObjektMitEinheiten,
} from "@/types/objekt"

export function ObjektKarte({ objekt }: { objekt: ObjektMitEinheiten }) {
  const einheiten = objekt.einheiten?.[0]?.count ?? 0

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{objekt.kuerzel}</span>
            <Badge variant={OBJEKT_STATUS_VARIANT[objekt.status] ?? "secondary"}>
              {OBJEKT_STATUS_LABELS[objekt.status] ?? objekt.status}
            </Badge>
          </div>
          <p className="truncate text-sm">{objekt.bezeichnung ?? "–"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatAdresse(objekt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {objekt.objekttyp
                ? (OBJEKTTYP_LABELS[objekt.objekttyp] ?? objekt.objekttyp)
                : "–"}
            </span>
            <span>{einheiten} Einheiten</span>
            <span>
              {formatEUR(
                objekt.marktwert_sprengnetter ?? objekt.marktwert_pricehubble
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
