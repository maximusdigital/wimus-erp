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
import { formatAdresse, formatEUR } from "@/lib/utils/format"
import {
  OBJEKTTYP_LABELS,
  OBJEKT_STATUS_LABELS,
  OBJEKT_STATUS_VARIANT,
  type ObjektMitEinheiten,
} from "@/types/objekt"

export function ObjektTabelle({ objekte }: { objekte: ObjektMitEinheiten[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kürzel</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="text-right">Einheiten</TableHead>
            <TableHead className="text-right">Marktwert</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objekte.map((o) => (
            <TableRow key={o.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link
                  href={`/objekte/${o.id}`}
                  className="hover:underline"
                >
                  {o.kuerzel}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatAdresse({ ...o, ort: o.stadt })}
              </TableCell>
              <TableCell>
                {o.typ ? (OBJEKTTYP_LABELS[o.typ] ?? o.typ) : "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {o.einheiten?.[0]?.count ?? 0}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(o.marktwert_sprengnetter ?? o.marktwert_pricehubble)}
              </TableCell>
              <TableCell>
                <Badge variant={OBJEKT_STATUS_VARIANT[o.status] ?? "secondary"}>
                  {OBJEKT_STATUS_LABELS[o.status] ?? o.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
