import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/ui/priority-badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/format"
import {
  einheitLabel,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_STATUS_LABELS,
  VORGANG_STATUS_VARIANT,
  VORGANG_TYP_LABELS,
  type VorgangMitRelationen,
} from "@/types/vorgang"

export function VorgangKarte({ vorgang }: { vorgang: VorgangMitRelationen }) {
  const bezug = [vorgang.objekt?.kuerzel, einheitLabel(vorgang.einheit)]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link href={`/vorgaenge/${vorgang.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ClipboardList className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{vorgang.titel}</span>
              <Badge
                variant={
                  VORGANG_STATUS_VARIANT[vorgang.status] ?? "secondary"
                }
                className="shrink-0"
              >
                {VORGANG_STATUS_LABELS[vorgang.status] ?? vorgang.status}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {bezug || "Kein Bezug"}
              {vorgang.typ
                ? ` · ${VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ}`
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <PriorityBadge
                prioritaet={vorgang.prioritaet}
                className="text-[0.7rem]"
              >
                {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ??
                  vorgang.prioritaet}
              </PriorityBadge>
              {vorgang.faellig_am ? (
                <span>Fällig: {formatDate(vorgang.faellig_am)}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
