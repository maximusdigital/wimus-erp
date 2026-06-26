import Link from "next/link"

import { RowActions } from "@/components/shared/row-actions"
import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/ui/priority-badge"
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
  vorgangTitel,
  VORGANG_PRIORITAET_LABELS,
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
            <TableHead>Vorgang</TableHead>
            <TableHead>Objekt / Einheit</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Priorität</TableHead>
            <TableHead>Leistung</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vorgaenge.map((v) => (
            <TableRow key={v.id} className="group hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/vorgaenge/${v.id}`} className="hover:underline">
                  {vorgangTitel(v)}
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
                <PriorityBadge prioritaet={v.prioritaet}>
                  {VORGANG_PRIORITAET_LABELS[v.prioritaet] ?? v.prioritaet}
                </PriorityBadge>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDate(v.leistungsdatum)}
              </TableCell>
              <TableCell>
                <Badge variant={VORGANG_STATUS_VARIANT[v.status] ?? "secondary"}>
                  {VORGANG_STATUS_LABELS[v.status] ?? v.status}
                </Badge>
              </TableCell>
              <TableCell>
                <RowActions
                  editHref={`/vorgaenge/${v.id}/bearbeiten`}
                  destructive={{
                    kind: "soft",
                    label: "Löschen",
                    deleteUrl: `/api/vorgaenge/${v.id}`,
                    description: "Vorgang wird gelöscht.",
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
