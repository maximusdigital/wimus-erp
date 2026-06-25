import Link from "next/link"
import { PiggyBank } from "lucide-react"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatEUR } from "@/lib/utils/format"
import {
  KAUTION_ANLAGE_ART_LABELS,
  KAUTION_STATUS_LABELS,
  type KautionMitRelationen,
} from "@/types/kaution"

export function KautionKarte({ kaution }: { kaution: KautionMitRelationen }) {
  return (
    <Link href={`/finanzen/kautionen/${kaution.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <PiggyBank className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {kaution.vertrag?.aktenzeichen ?? "Kaution"}
              </span>
              <StatusBadge status={kaution.status}>
                {KAUTION_STATUS_LABELS[kaution.status] ?? kaution.status}
              </StatusBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Betrag: {formatEUR(kaution.betrag)}</span>
              {kaution.anlage_art ? (
                <span>
                  {KAUTION_ANLAGE_ART_LABELS[kaution.anlage_art] ??
                    kaution.anlage_art}
                </span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
