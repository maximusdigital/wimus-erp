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
import {
  EINHEITSTYP_LABELS,
  EINHEIT_STATUS_LABELS,
  EINHEIT_STATUS_VARIANT,
  type EinheitMitObjekt,
} from "@/types/einheit"

export function EinheitTabelle({ einheiten }: { einheiten: EinheitMitObjekt[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Objekt</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Lage</TableHead>
            <TableHead className="text-right">Fläche</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {einheiten.map((e) => (
            <TableRow key={e.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/einheiten/${e.id}`} className="hover:underline">
                  {e.verwendungszweck_code ?? "–"}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/einheiten/${e.id}`} className="hover:underline">
                  {e.bezeichnung ?? "–"}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {e.objekte?.kuerzel ?? "–"}
              </TableCell>
              <TableCell>
                {e.einheitstyp
                  ? (EINHEITSTYP_LABELS[e.einheitstyp] ?? e.einheitstyp)
                  : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {e.lage ?? "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {e.wohnflaeche_qm != null ? `${e.wohnflaeche_qm} m²` : "–"}
              </TableCell>
              <TableCell>
                <Badge variant={EINHEIT_STATUS_VARIANT[e.status] ?? "secondary"}>
                  {EINHEIT_STATUS_LABELS[e.status] ?? e.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
