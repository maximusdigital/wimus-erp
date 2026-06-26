import Link from "next/link"

import { RowActions } from "@/components/shared/row-actions"
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
import {
  einheitLabel,
  ASSET_STANDORT_TYP_LABELS,
  ASSET_TYP_LABELS,
  ASSET_ZUSTAND_LABELS,
  ASSET_ZUSTAND_VARIANT,
  type AssetMitRelationen,
} from "@/types/asset"

export function AssetTabelle({ assets }: { assets: AssetMitRelationen[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Asset-Code</TableHead>
            <TableHead>Zustand</TableHead>
            <TableHead>Standort</TableHead>
            <TableHead>Objekt / Einheit</TableHead>
            <TableHead className="text-right">Wert</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((a) => (
            <TableRow key={a.id} className="group hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/inventar/${a.id}`} className="hover:underline">
                  {a.bezeichnung}
                </Link>
              </TableCell>
              <TableCell>
                {a.typ ? (ASSET_TYP_LABELS[a.typ] ?? a.typ) : "–"}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {a.asset_code ?? "–"}
              </TableCell>
              <TableCell>
                {a.zustand ? (
                  <Badge variant={ASSET_ZUSTAND_VARIANT[a.zustand] ?? "secondary"}>
                    {ASSET_ZUSTAND_LABELS[a.zustand] ?? a.zustand}
                  </Badge>
                ) : (
                  "–"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {a.standort_typ
                  ? (ASSET_STANDORT_TYP_LABELS[a.standort_typ] ?? a.standort_typ)
                  : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {a.objekt?.kuerzel ?? "–"}
                {einheitLabel(a.einheit) ? ` · ${einheitLabel(a.einheit)}` : ""}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(a.anschaffung_wert)}
              </TableCell>
              <TableCell>
                <RowActions
                  editHref={`/inventar/${a.id}/bearbeiten`}
                  destructive={{
                    kind: "soft",
                    label: "Löschen",
                    deleteUrl: `/api/assets/${a.id}`,
                    description: `"${a.bezeichnung}" wird gelöscht.`,
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
