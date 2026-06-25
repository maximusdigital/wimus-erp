import Link from "next/link"
import { ChevronLeft, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
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
  orderProjekteTree,
  PROJEKT_STATUS_LABELS,
  PROJEKT_TYP_LABELS,
  type Projekt,
} from "@/types/projekt"

export const metadata = { title: "Projekte – Einstellungen" }

type ProjektRow = Projekt & { status: string | null; aktiv: boolean | null }

export default async function ProjekteVerwaltungPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("projekte")
    .select(
      "id, name, kuerzel, typ, status, ebene, parent_projekt_id, ci_farbe_primary, aktiv"
    )
  const projekte = orderProjekteTree((data as ProjektRow[] | null) ?? []) as ProjektRow[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Einstellungen
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Projekte</h1>
            <p className="text-sm text-muted-foreground">
              {projekte.length} Projekte (inkl. Unterprojekte)
            </p>
          </div>
          <Button render={<Link href="/einstellungen/projekte/neu" />}>
            <Plus />
            <span>Neues Projekt</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kürzel</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projekte.map((p) => {
              const sub = (p.ebene ?? 0) > 0
              return (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/einstellungen/projekte/${p.id}/bearbeiten`}
                      className="flex items-center gap-2 hover:underline"
                      style={sub ? { paddingLeft: `${(p.ebene ?? 0) * 16}px` } : undefined}
                    >
                      {sub ? <span className="text-muted-foreground">↳</span> : null}
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.ci_farbe_primary ?? "var(--muted-foreground)" }}
                      />
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.kuerzel ?? "–"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.typ ? (PROJEKT_TYP_LABELS[p.typ] ?? p.typ) : "–"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.aktiv === false ? "inaktiv" : (p.status ?? "aktiv")}>
                      {p.aktiv === false
                        ? "Inaktiv"
                        : PROJEKT_STATUS_LABELS[p.status ?? "aktiv"] ?? p.status}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
