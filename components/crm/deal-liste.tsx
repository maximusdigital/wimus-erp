import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatEUR } from "@/lib/utils/format"
import { tageInStage, istStalled } from "@/lib/crm/stage"
import type { DealMitBezug, PipelineStage } from "@/types/crm"

function bezug(d: DealMitBezug): string {
  if (d.organisation?.name) return d.organisation.name
  if (d.kontakt) return [d.kontakt.vorname, d.kontakt.nachname].filter(Boolean).join(" ") || "–"
  return "–"
}

export function DealListe({
  deals,
  stages,
}: {
  deals: DealMitBezug[]
  stages: PipelineStage[]
}) {
  const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? "–"

  if (deals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Keine Deals in dieser Auswahl.
      </p>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Kontakt / Organisation</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-right">Wert</TableHead>
            <TableHead className="text-right">Tage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((d) => {
            const tage = tageInStage(d.in_stage_seit, new Date())
            const stalled = istStalled(tage, d.stage?.stalled_tage ?? null)
            return (
              <TableRow key={d.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/crm/deals/${d.id}`} className="hover:underline">
                    {d.titel}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{bezug(d)}</TableCell>
                <TableCell>
                  <StatusBadge status="offen" tone="muted">
                    {stageName(d.stage_id)}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatEUR(d.wert)}</TableCell>
                <TableCell
                  className={`text-right tabular-nums ${stalled ? "text-danger" : "text-muted-foreground"}`}
                >
                  {tage}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
