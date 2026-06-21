import Link from "next/link"
import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  VERTRAGSART_LABELS,
  VERTRAG_STATUS_LABELS,
  VERTRAG_STATUS_VARIANT,
  warmmiete,
  type VertragMitRelationen,
} from "@/types/vertrag"

export function VertragKarte({ vertrag }: { vertrag: VertragMitRelationen }) {
  return (
    <Link href={`/vertraege/${vertrag.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {vertrag.vertragsnummer ??
                  (vertrag.vertragsart
                    ? (VERTRAGSART_LABELS[vertrag.vertragsart] ??
                      vertrag.vertragsart)
                    : "Vertrag")}
              </span>
              <Badge
                variant={VERTRAG_STATUS_VARIANT[vertrag.status] ?? "secondary"}
              >
                {VERTRAG_STATUS_LABELS[vertrag.status] ?? vertrag.status}
              </Badge>
            </div>
            <p className="truncate text-sm">
              {vertrag.mieter ? kontaktName(vertrag.mieter) : "–"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {vertrag.objekt?.kuerzel ?? "–"}
              {vertrag.einheit?.verwendungszweck_code
                ? ` · ${vertrag.einheit.verwendungszweck_code}`
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Grund: {formatEUR(vertrag.grundmiete)}</span>
              <span>Warm: {formatEUR(warmmiete(vertrag))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
