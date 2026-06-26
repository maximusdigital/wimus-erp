import Link from "next/link"

import { RowActions } from "@/components/shared/row-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EINHEITSTYP_LABELS, type EinheitMitObjekt } from "@/types/einheit"

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
            <TableHead>Aktiv</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {einheiten.map((e) => (
            <TableRow key={e.id} className="group hover:bg-muted/50">
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
                {e.typ ? (EINHEITSTYP_LABELS[e.typ] ?? e.typ) : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {e.lage ?? "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {e.flaeche != null ? `${e.flaeche} m²` : "–"}
              </TableCell>
              <TableCell>
                <StatusBadge status={e.aktiv ? "aktiv" : "inaktiv"}>
                  {e.aktiv ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <RowActions
                  editHref={`/einheiten/${e.id}/bearbeiten`}
                  destructive={{
                    kind: "soft",
                    label: "Löschen",
                    deleteUrl: `/api/einheiten/${e.id}`,
                    description: "Einheit wird gelöscht.",
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
