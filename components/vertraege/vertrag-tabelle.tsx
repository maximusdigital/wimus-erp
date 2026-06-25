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
import { kontaktName } from "@/types/kontakt"
import {
  VERTRAGSTYP_LABELS,
  VERTRAG_STATUS_LABELS,
  warmmiete,
  type VertragMitRelationen,
} from "@/types/vertrag"

export function VertragTabelle({
  vertraege,
}: {
  vertraege: VertragMitRelationen[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vertrag</TableHead>
            <TableHead>Mieter</TableHead>
            <TableHead>Objekt / Einheit</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="text-right">Grundmiete</TableHead>
            <TableHead className="text-right">Warm</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vertraege.map((v) => (
            <TableRow key={v.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/vertraege/${v.id}`} className="hover:underline">
                  {v.vertragstyp
                    ? (VERTRAGSTYP_LABELS[v.vertragstyp] ?? v.vertragstyp)
                    : "Vertrag"}
                </Link>
              </TableCell>
              <TableCell>{v.mieter ? kontaktName(v.mieter) : "–"}</TableCell>
              <TableCell className="text-muted-foreground">
                {v.einheit?.objekt?.kuerzel ?? "–"}
                {v.einheit?.verwendungszweck_code
                  ? ` · ${v.einheit.verwendungszweck_code}`
                  : ""}
              </TableCell>
              <TableCell>
                {v.vertragstyp
                  ? (VERTRAGSTYP_LABELS[v.vertragstyp] ?? v.vertragstyp)
                  : "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(v.grundmiete)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(warmmiete(v))}
              </TableCell>
              <TableCell>
                <StatusBadge status={v.status}>
                  {VERTRAG_STATUS_LABELS[v.status] ?? v.status}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
