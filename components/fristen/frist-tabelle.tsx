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
import { formatDate } from "@/lib/utils/format"
import { fristAmpel, type FristAmpel } from "@/lib/utils/fristen"
import {
  FRIST_STATUS_LABELS,
  FRIST_TYP_LABELS,
  type Frist,
} from "@/types/frist"

const AMPEL_CLASS: Record<FristAmpel, string> = {
  rot: "bg-danger",
  gelb: "bg-warning",
  gruen: "bg-success",
  erledigt: "bg-muted-foreground",
}

export function AmpelDot({
  faellig_am,
  heute,
  status,
}: {
  faellig_am: string | null | undefined
  heute: string
  status?: string | null
}) {
  const ampel = fristAmpel(faellig_am, heute, status)
  return (
    <span
      className={`inline-block size-2.5 rounded-full ${AMPEL_CLASS[ampel]}`}
      aria-label={`Ampel: ${ampel}`}
      title={ampel}
    />
  )
}

export function FristTabelle({
  fristen,
  heute,
}: {
  fristen: Frist[]
  heute: string
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Typ</TableHead>
            <TableHead>Bezeichnung</TableHead>
            <TableHead>Fällig</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fristen.map((f) => (
            <TableRow key={f.id} className="hover:bg-muted/50">
              <TableCell>
                <AmpelDot
                  faellig_am={f.faellig_am}
                  heute={heute}
                  status={f.status}
                />
              </TableCell>
              <TableCell>{FRIST_TYP_LABELS[f.frist_typ] ?? f.frist_typ}</TableCell>
              <TableCell className="font-medium">
                <Link href={`/fristen/${f.id}`} className="hover:underline">
                  {f.bezeichnung || FRIST_TYP_LABELS[f.frist_typ] || "Frist"}
                </Link>
              </TableCell>
              <TableCell>{formatDate(f.faellig_am)}</TableCell>
              <TableCell>
                <StatusBadge status={f.status}>
                  {FRIST_STATUS_LABELS[f.status] ?? f.status}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
