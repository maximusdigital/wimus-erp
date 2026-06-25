import Link from "next/link"
import { BedDouble } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  BUCHUNG_STATUS_LABELS,
  BUCHUNG_STATUS_VARIANT,
  KANAL_LABELS,
  type BuchungMitRelationen,
} from "@/types/buchung"

export function BuchungKarte({ buchung }: { buchung: BuchungMitRelationen }) {
  const einheit =
    buchung.einheit?.verwendungszweck_code ??
    buchung.einheit?.bezeichnung ??
    "Buchung"

  return (
    <Link href={`/buchungen/${buchung.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <BedDouble className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{einheit}</span>
              <Badge
                variant={BUCHUNG_STATUS_VARIANT[buchung.status] ?? "secondary"}
              >
                {BUCHUNG_STATUS_LABELS[buchung.status] ?? buchung.status}
              </Badge>
            </div>
            <p className="truncate text-sm">
              {buchung.gast ? kontaktName(buchung.gast) : "–"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {formatDate(buchung.checkin)} – {formatDate(buchung.checkout)}
              {buchung.kanal
                ? ` · ${KANAL_LABELS[buchung.kanal] ?? buchung.kanal}`
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Betrag: {formatEUR(buchung.betrag_brutto)}</span>
              {buchung.einheit?.objekt?.kuerzel ? (
                <span>Objekt: {buchung.einheit.objekt.kuerzel}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
