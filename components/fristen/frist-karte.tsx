import Link from "next/link"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/format"
import { AmpelDot } from "@/components/fristen/frist-tabelle"
import {
  FRIST_STATUS_LABELS,
  FRIST_TYP_LABELS,
  type Frist,
} from "@/types/frist"

export function FristKarte({
  frist,
  heute,
}: {
  frist: Frist
  heute: string
}) {
  return (
    <Link href={`/fristen/${frist.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-1.5">
            <AmpelDot
              faellig_am={frist.faellig_am}
              heute={heute}
              status={frist.status}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {frist.bezeichnung ||
                  FRIST_TYP_LABELS[frist.frist_typ] ||
                  "Frist"}
              </span>
              <StatusBadge status={frist.status}>
                {FRIST_STATUS_LABELS[frist.status] ?? frist.status}
              </StatusBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{FRIST_TYP_LABELS[frist.frist_typ] ?? frist.frist_typ}</span>
              <span>Fällig: {formatDate(frist.faellig_am)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
