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
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  MAHN_STATUS_LABELS,
  MAHN_STATUS_VARIANT,
  MAHN_STUFE_LABELS,
  type MahnungMitRelationen,
} from "@/types/mahnung"

export function MahnungTabelle({
  mahnungen,
}: {
  mahnungen: MahnungMitRelationen[]
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stufe</TableHead>
            <TableHead>Mieter</TableHead>
            <TableHead>Vertrag</TableHead>
            <TableHead className="text-right">Gesamt</TableHead>
            <TableHead>Fällig</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mahnungen.map((m) => (
            <TableRow key={m.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/finanzen/mahnungen/${m.id}`} className="hover:underline">
                  {MAHN_STUFE_LABELS[m.stufe] ?? `Stufe ${m.stufe}`}
                </Link>
              </TableCell>
              <TableCell>{m.mieter ? kontaktName(m.mieter) : "–"}</TableCell>
              <TableCell className="text-muted-foreground">
                {m.vertrag?.vertragsnummer ?? "–"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatEUR(m.gesamt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(m.faellig_am)}
              </TableCell>
              <TableCell>
                <Badge variant={MAHN_STATUS_VARIANT[m.status] ?? "secondary"}>
                  {MAHN_STATUS_LABELS[m.status] ?? m.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
