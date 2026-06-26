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
import type { LieferantMitFirma } from "@/types/lieferant"

export function LieferantTabelle({
  lieferanten,
}: {
  lieferanten: LieferantMitFirma[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Alias</TableHead>
            <TableHead>Std-Gewerk</TableHead>
            <TableHead>Std-Konto</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lieferanten.map((l) => (
            <TableRow key={l.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link
                  href={`/fibu/lieferanten/${l.id}`}
                  className="hover:underline"
                >
                  {l.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {l.alias && l.alias.length > 0 ? l.alias.join(", ") : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {l.standard_gewerk || "–"}
              </TableCell>
              <TableCell className="tabular-nums">
                {l.standard_konto || "–"}
              </TableCell>
              <TableCell>
                <StatusBadge status={l.aktiv ? "aktiv" : "inaktiv"}>
                  {l.aktiv ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
