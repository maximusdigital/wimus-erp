import Link from "next/link"

import { RowActions } from "@/components/shared/row-actions"
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
  KONTOART_LABELS,
  SKR_BASIS_LABELS,
  type FibuKontoMitFirma,
} from "@/types/fibu-konto"

export function FibuKontoTabelle({ konten }: { konten: FibuKontoMitFirma[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Konto</TableHead>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>SKR</TableHead>
            <TableHead>Art</TableHead>
            <TableHead>USt</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {konten.map((k) => (
            <TableRow key={k.id} className="group hover:bg-muted/50">
              <TableCell className="font-medium tabular-nums">
                <Link href={`/fibu/konten/${k.id}`} className="hover:underline">
                  {k.kontonummer}
                </Link>
              </TableCell>
              <TableCell>{k.bezeichnung}</TableCell>
              <TableCell className="text-muted-foreground">
                {k.skr_basis ? (SKR_BASIS_LABELS[k.skr_basis] ?? k.skr_basis) : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {k.kontoart ? (KONTOART_LABELS[k.kontoart] ?? k.kontoart) : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {k.ust_automatik || "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {k.firma?.name ?? "Alle"}
              </TableCell>
              <TableCell>
                <StatusBadge status={k.aktiv ? "aktiv" : "inaktiv"}>
                  {k.aktiv ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <RowActions
                  editHref={`/fibu/konten/${k.id}`}
                  destructive={{
                    kind: "hard",
                    deleteUrl: `/api/fibu/konten/${k.id}`,
                    description: `Konto ${k.kontonummer} wird dauerhaft gelöscht.`,
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
