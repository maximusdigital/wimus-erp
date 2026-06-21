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
import { formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  VERTRAGSART_LABELS,
  VERTRAG_STATUS_LABELS,
  VERTRAG_STATUS_VARIANT,
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
            <TableHead>Art</TableHead>
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
                  {v.vertragsnummer ?? "—"}
                </Link>
              </TableCell>
              <TableCell>{v.mieter ? kontaktName(v.mieter) : "–"}</TableCell>
              <TableCell className="text-muted-foreground">
                {v.objekt?.kuerzel ?? "–"}
                {v.einheit?.verwendungszweck_code
                  ? ` · ${v.einheit.verwendungszweck_code}`
                  : ""}
              </TableCell>
              <TableCell>
                {v.vertragsart
                  ? (VERTRAGSART_LABELS[v.vertragsart] ?? v.vertragsart)
                  : "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(v.grundmiete)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(warmmiete(v))}
              </TableCell>
              <TableCell>
                <Badge variant={VERTRAG_STATUS_VARIANT[v.status] ?? "secondary"}>
                  {VERTRAG_STATUS_LABELS[v.status] ?? v.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
