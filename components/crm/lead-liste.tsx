import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/utils/format"
import { quelleLabel } from "@/lib/crm/constants"
import { LeadAktionen } from "@/components/crm/lead-aktionen"
import type { FirmaRef, Lead, Pipeline, PipelineStage } from "@/types/crm"

type LeadMitBezug = Lead & {
  kontakt?: { id: string; vorname: string | null; nachname: string | null } | null
  organisation?: { id: string; name: string } | null
}
type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

function bezug(l: LeadMitBezug): string {
  if (l.organisation?.name) return l.organisation.name
  if (l.kontakt) return [l.kontakt.vorname, l.kontakt.nachname].filter(Boolean).join(" ") || "–"
  return l.kontaktdaten || "–"
}

export function LeadListe({
  leads,
  firmen,
  pipelines,
}: {
  leads: LeadMitBezug[]
  firmen: FirmaRef[]
  pipelines: PipelineMitStages[]
}) {
  return (
    <>
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Kontakt / Firma</TableHead>
              <TableHead>Quelle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="w-44" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id} className="group hover:bg-muted/50">
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell className="text-muted-foreground">{bezug(l)}</TableCell>
                <TableCell className="text-muted-foreground">{quelleLabel(l.quelle)}</TableCell>
                <TableCell>
                  <StatusBadge status={l.status === "neu" ? "offen" : "inbearbeitung"}>
                    {l.status === "neu" ? "Neu" : "Qualifiziert"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.created_at)}</TableCell>
                <TableCell>
                  <LeadAktionen lead={l} firmen={firmen} pipelines={pipelines} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {leads.map((l) => (
          <div key={l.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-muted-foreground">{bezug(l)}</p>
              </div>
              <StatusBadge status={l.status === "neu" ? "offen" : "inbearbeitung"}>
                {l.status === "neu" ? "Neu" : "Qualifiziert"}
              </StatusBadge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {quelleLabel(l.quelle)} · {formatDate(l.created_at)}
            </div>
            <div className="mt-2">
              <LeadAktionen lead={l} firmen={firmen} pipelines={pipelines} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
