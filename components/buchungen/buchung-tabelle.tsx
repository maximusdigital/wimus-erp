import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  BUCHUNG_STATUS_LABELS,
  BUCHUNG_STATUS_VARIANT,
  KANAL_LABELS,
  type BuchungMitRelationen,
} from "@/types/buchung"

function einheitLabel(b: BuchungMitRelationen): string {
  return (
    b.einheit?.verwendungszweck_code ?? b.einheit?.bezeichnung ?? "–"
  )
}

export function BuchungTabelle({
  buchungen,
}: {
  buchungen: BuchungMitRelationen[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Einheit</TableHead>
            <TableHead>Gast</TableHead>
            <TableHead>Zeitraum</TableHead>
            <TableHead>Kanal</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buchungen.map((b) => (
            <TableRow key={b.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/buchungen/${b.id}`} className="hover:underline">
                  {einheitLabel(b)}
                </Link>
                {b.objekt?.kuerzel ? (
                  <span className="text-muted-foreground">
                    {" "}· {b.objekt.kuerzel}
                  </span>
                ) : null}
              </TableCell>
              <TableCell>{b.gast ? kontaktName(b.gast) : "–"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(b.checkin)} – {formatDate(b.checkout)}
              </TableCell>
              <TableCell>
                {b.kanal ? (KANAL_LABELS[b.kanal] ?? b.kanal) : "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(b.betrag)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={BUCHUNG_STATUS_VARIANT[b.status] ?? "secondary"}
                >
                  {BUCHUNG_STATUS_LABELS[b.status] ?? b.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
