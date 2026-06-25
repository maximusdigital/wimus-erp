import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatEUR } from "@/lib/utils/format"
import {
  MAHN_STATUS_LABELS,
  MAHN_STATUS_VARIANT,
  MAHN_STUFE_LABELS,
  type MahnungMitRelationen,
} from "@/types/mahnung"

export function MahnungKarte({ mahnung }: { mahnung: MahnungMitRelationen }) {
  return (
    <Link href={`/finanzen/mahnungen/${mahnung.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {MAHN_STUFE_LABELS[mahnung.stufe] ?? `Stufe ${mahnung.stufe}`}
              </span>
              <Badge variant={MAHN_STATUS_VARIANT[mahnung.status] ?? "secondary"}>
                {MAHN_STATUS_LABELS[mahnung.status] ?? mahnung.status}
              </Badge>
            </div>
            <p className="truncate text-sm">
              {mahnung.vertrag?.aktenzeichen ?? "–"}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Gesamt: {formatEUR(mahnung.gesamtforderung)}</span>
              <span>Fällig: {formatDate(mahnung.faellig_am)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
