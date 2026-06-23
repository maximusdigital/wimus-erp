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
import { formatDate } from "@/lib/utils/format"
import {
  einheitLabel,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_PRIORITAET_VARIANT,
  VORGANG_STATUS_LABELS,
  VORGANG_STATUS_VARIANT,
  VORGANG_TYP_LABELS,
  type VorgangMitRelationen,
} from "@/types/vorgang"

export function VorgangTabelle({
  vorgaenge,
}: {
  vorgaenge: VorgangMitRelationen[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Objekt / Einheit</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Priorität</TableHead>
            <TableHead>Fällig</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vorgaenge.map((v) => (
            <TableRow key={v.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/vorgaenge/${v.id}`} className="hover:underline">
                  {v.titel}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {v.objekt?.kuerzel ?? "–"}
                {einheitLabel(v.einheit) ? ` · ${einheitLabel(v.einheit)}` : ""}
              </TableCell>
              <TableCell>
                {v.typ ? (VORGANG_TYP_LABELS[v.typ] ?? v.typ) : "–"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={VORGANG_PRIORITAET_VARIANT[v.prioritaet] ?? "secondary"}
                >
                  {VORGANG_PRIORITAET_LABELS[v.prioritaet] ?? v.prioritaet}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDate(v.faellig_am)}
              </TableCell>
              <TableCell>
                <Badge variant={VORGANG_STATUS_VARIANT[v.status] ?? "secondary"}>
                  {VORGANG_STATUS_LABELS[v.status] ?? v.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
