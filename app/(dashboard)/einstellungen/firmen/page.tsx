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

export const metadata = { title: "Firmen – Einstellungen" }

type FirmaRow = {
  id: string
  name: string
  kuerzel: string | null
  rechtsform: string | null
  aktiv: boolean | null
}

export default async function FirmenVerwaltungPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("firmen")
    .select("id, name, kuerzel, rechtsform, aktiv")
    .order("name")
  const firmen = (data as FirmaRow[] | null) ?? []

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
            <h1 className="text-xl font-semibold tracking-tight">Firmen</h1>
            <p className="text-sm text-muted-foreground">
              {firmen.length} Tochterunternehmen (Org-Ebene 2)
            </p>
          </div>
          <Button render={<Link href="/einstellungen/firmen/neu" />}>
            <Plus />
            <span>Neue Firma</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kürzel</TableHead>
              <TableHead>Rechtsform</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {firmen.map((f) => (
              <TableRow key={f.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link
                    href={`/einstellungen/firmen/${f.id}/bearbeiten`}
                    className="hover:underline"
                  >
                    {f.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{f.kuerzel ?? "–"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {f.rechtsform ?? "–"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={f.aktiv === false ? "inaktiv" : "aktiv"}>
                    {f.aktiv === false ? "Inaktiv" : "Aktiv"}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
