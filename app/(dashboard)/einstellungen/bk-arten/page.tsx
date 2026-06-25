import Link from "next/link"
import { ChevronLeft, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { BK_KATEGORIE_LABELS, BK_SCHLUESSEL_LABELS } from "@/types/bk-art"
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

export const metadata = { title: "BK-Kostenarten – Einstellungen" }

type BkArtRow = {
  id: string
  bezeichnung: string
  kategorie: string | null
  standard_schluessel: string | null
  umlagefaehig: boolean | null
  aktiv: boolean | null
}

export default async function BkArtenVerwaltungPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("bk_arten")
    .select("id, bezeichnung, kategorie, standard_schluessel, umlagefaehig, aktiv")
    .order("bezeichnung")
  const bkArten = (data as BkArtRow[] | null) ?? []

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
            <h1 className="text-xl font-semibold tracking-tight">BK-Kostenarten</h1>
            <p className="text-sm text-muted-foreground">
              {bkArten.length} Betriebskosten-Kostenarten im Katalog
            </p>
          </div>
          <Button render={<Link href="/einstellungen/bk-arten/neu" />}>
            <Plus />
            <span>Neue Kostenart</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bezeichnung</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Schlüssel</TableHead>
              <TableHead>Umlagefähig</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bkArten.map((b) => (
              <TableRow key={b.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link
                    href={`/einstellungen/bk-arten/${b.id}/bearbeiten`}
                    className="hover:underline"
                  >
                    {b.bezeichnung}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {b.kategorie ? (BK_KATEGORIE_LABELS[b.kategorie] ?? b.kategorie) : "–"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {b.standard_schluessel
                    ? (BK_SCHLUESSEL_LABELS[b.standard_schluessel] ??
                      b.standard_schluessel)
                    : "–"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {b.umlagefaehig === false ? "Nein" : "Ja"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.aktiv === false ? "inaktiv" : "aktiv"}>
                    {b.aktiv === false ? "Inaktiv" : "Aktiv"}
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
