import Link from "next/link"
import { ChevronLeft, Plus, Receipt } from "lucide-react"

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
import { Card, CardContent } from "@/components/ui/card"
import { formatEUR } from "@/lib/utils/format"
import type { KostenpositionMitRelationen } from "@/types/betriebskosten"

export const metadata = {
  title: "Kostenpositionen",
}

const SELECT =
  "*, objekt:objekte(kuerzel, stadt), bk_art:bk_arten(bezeichnung, kategorie, standard_schluessel), abrechnungseinheit:abrechnungseinheiten(id, bezeichnung)"

export default async function KostenpositionenPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("kostenverteilung_positionen")
    .select(SELECT)
    .order("created_at", { ascending: false })

  const positionen = (data ?? []) as unknown as KostenpositionMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/betriebskosten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Betriebskosten
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Kostenpositionen
            </h1>
            <p className="text-muted-foreground text-sm">
              {positionen.length}{" "}
              {positionen.length === 1 ? "Position" : "Positionen"}
            </p>
          </div>
          <Button render={<Link href="/betriebskosten/positionen/neu" />}>
            <Plus />
            <span>Neue Kostenposition</span>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : positionen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Kostenpositionen</p>
            <p className="text-muted-foreground text-sm">
              Erfasse Kostenpositionen, um sie auf Abrechnungseinheiten umzulegen.
            </p>
          </div>
          <Button
            render={<Link href="/betriebskosten/positionen/neu" />}
            variant="outline"
          >
            <Plus />
            <span>Kostenposition anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kostenart</TableHead>
                    <TableHead>Objekt</TableHead>
                    <TableHead>Abrechnungseinheit</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Umlagefähig</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positionen.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/betriebskosten/positionen/${p.id}/bearbeiten`}
                          className="hover:underline"
                        >
                          {p.bk_art?.bezeichnung ?? "Kostenart"}
                        </Link>
                      </TableCell>
                      <TableCell>{p.objekt?.kuerzel ?? "–"}</TableCell>
                      <TableCell>
                        {p.abrechnungseinheit?.bezeichnung ?? "–"}
                      </TableCell>
                      <TableCell>{p.abrechnungsperiode ?? "–"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(p.betrag_brutto)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            p.umlagefaehig === false ? "inaktiv" : "aktiv"
                          }
                        >
                          {p.umlagefaehig === false ? "Nein" : "Ja"}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="space-y-2 md:hidden">
            {positionen.map((p) => (
              <Link
                key={p.id}
                href={`/betriebskosten/positionen/${p.id}/bearbeiten`}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Receipt className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {p.bk_art?.bezeichnung ?? "Kostenart"}
                        </span>
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {formatEUR(p.betrag_brutto)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Objekt: {p.objekt?.kuerzel ?? "–"}</span>
                        {p.abrechnungseinheit?.bezeichnung ? (
                          <span>{p.abrechnungseinheit.bezeichnung}</span>
                        ) : null}
                        {p.abrechnungsperiode ? (
                          <span>Periode: {p.abrechnungsperiode}</span>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
