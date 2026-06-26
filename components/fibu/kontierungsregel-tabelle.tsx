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
  KONTIERUNG_SCOPE_LABELS,
  type KontierungsregelMitFirma,
} from "@/types/kontierungsregel"

export function KontierungsregelTabelle({
  regeln,
}: {
  regeln: KontierungsregelMitFirma[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Prio</TableHead>
            <TableHead>Match</TableHead>
            <TableHead>Soll-Konto</TableHead>
            <TableHead>USt</TableHead>
            <TableHead>Geltung</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {regeln.map((r) => (
            <TableRow key={r.id} className="group hover:bg-muted/50">
              <TableCell className="tabular-nums text-muted-foreground">
                {r.prioritaet}
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/fibu/kontierungsregeln/${r.id}`}
                  className="hover:underline"
                >
                  {r.match}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">{r.soll_konto}</TableCell>
              <TableCell className="text-muted-foreground">
                {r.ust_satz != null ? `${r.ust_satz} %` : "–"}
                {r.steuerschluessel ? ` (${r.steuerschluessel})` : ""}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {r.scope === "einheit" && r.firma
                  ? r.firma.name
                  : KONTIERUNG_SCOPE_LABELS[r.scope] ?? r.scope}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.aktiv ? "aktiv" : "inaktiv"}>
                  {r.aktiv ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <RowActions
                  editHref={`/fibu/kontierungsregeln/${r.id}`}
                  destructive={{
                    kind: "hard",
                    deleteUrl: `/api/fibu/kontierungsregeln/${r.id}`,
                    description: `Regel "${r.match}" wird dauerhaft gelöscht.`,
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
