import Link from "next/link"
import { Receipt } from "lucide-react"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { offenerBetrag } from "@/lib/utils/forderungen"
import { kontaktName } from "@/types/kontakt"
import {
  FORDERUNG_STATUS_LABELS,
  FORDERUNG_TYP_LABELS,
  type ForderungMitRelationen,
} from "@/types/forderung"

export function ForderungKarte({
  forderung,
}: {
  forderung: ForderungMitRelationen
}) {
  return (
    <Link href={`/finanzen/forderungen/${forderung.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Receipt className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {forderung.kontakt
                  ? kontaktName(forderung.kontakt)
                  : "Forderung"}
              </span>
              <StatusBadge status={forderung.status}>
                {FORDERUNG_STATUS_LABELS[forderung.status] ?? forderung.status}
              </StatusBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {FORDERUNG_TYP_LABELS[forderung.forderung_typ] ??
                  forderung.forderung_typ}
              </span>
              <span>Betrag: {formatEUR(forderung.betrag)}</span>
              <span>Offen: {formatEUR(offenerBetrag(forderung))}</span>
              <span>Fällig: {formatDate(forderung.faellig_am)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
