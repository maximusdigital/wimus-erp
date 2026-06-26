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
import {
  GESELLSCHAFTER_TYP_LABELS,
  type Gesellschafter,
} from "@/types/gesellschafter"

export function GesellschafterTabelle({
  gesellschafter,
}: {
  gesellschafter: Gesellschafter[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Steuerliche ID</TableHead>
            <TableHead>Ort</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gesellschafter.map((g) => (
            <TableRow key={g.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link
                  href={`/fibu/gesellschafter/${g.id}`}
                  className="hover:underline"
                >
                  {g.name}
                </Link>
              </TableCell>
              <TableCell>
                {GESELLSCHAFTER_TYP_LABELS[g.typ] ?? g.typ}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {g.steuerliche_id || "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[g.plz, g.stadt].filter(Boolean).join(" ") || "–"}
              </TableCell>
              <TableCell>
                <StatusBadge status={g.aktiv ? "aktiv" : "inaktiv"}>
                  {g.aktiv ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
