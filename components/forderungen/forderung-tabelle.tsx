import Link from "next/link"

import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { offenerBetrag } from "@/lib/utils/forderungen"
import { kontaktName } from "@/types/kontakt"
import {
  FORDERUNG_STATUS_LABELS,
  FORDERUNG_TYP_LABELS,
  type ForderungMitRelationen,
} from "@/types/forderung"

export function ForderungTabelle({
  forderungen,
}: {
  forderungen: ForderungMitRelationen[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kontakt</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead className="text-right">Offen</TableHead>
            <TableHead>Fällig</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forderungen.map((f) => (
            <TableRow key={f.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link
                  href={`/finanzen/forderungen/${f.id}`}
                  className="hover:underline"
                >
                  {f.kontakt ? kontaktName(f.kontakt) : "Forderung"}
                </Link>
              </TableCell>
              <TableCell>
                {FORDERUNG_TYP_LABELS[f.forderung_typ] ?? f.forderung_typ}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(f.betrag)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(offenerBetrag(f))}
              </TableCell>
              <TableCell>{formatDate(f.faellig_am)}</TableCell>
              <TableCell>
                <StatusBadge status={f.status}>
                  {FORDERUNG_STATUS_LABELS[f.status] ?? f.status}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
