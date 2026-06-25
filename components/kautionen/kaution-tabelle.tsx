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
import { formatEUR } from "@/lib/utils/format"
import {
  KAUTION_ANLAGE_ART_LABELS,
  KAUTION_STATUS_LABELS,
  type KautionMitRelationen,
} from "@/types/kaution"

export function KautionTabelle({
  kautionen,
}: {
  kautionen: KautionMitRelationen[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vertrag</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead>Anlageart</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kautionen.map((k) => (
            <TableRow key={k.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/finanzen/kautionen/${k.id}`} className="hover:underline">
                  {k.vertrag?.aktenzeichen ?? "Kaution"}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(k.betrag)}
              </TableCell>
              <TableCell>
                {k.anlage_art
                  ? (KAUTION_ANLAGE_ART_LABELS[k.anlage_art] ?? k.anlage_art)
                  : "–"}
              </TableCell>
              <TableCell>
                <StatusBadge status={k.status}>
                  {KAUTION_STATUS_LABELS[k.status] ?? k.status}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
