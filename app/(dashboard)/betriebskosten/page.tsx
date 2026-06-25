import Link from "next/link"
import { Calculator, Plus, Receipt } from "lucide-react"

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
import { BK_SCHLUESSEL_LABELS } from "@/types/bk-art"
import type { AbrechnungseinheitMitRelationen } from "@/types/betriebskosten"

export const metadata = {
  title: "Betriebskosten",
}

const SELECT = "*, objekt:objekte(kuerzel, stadt)"

export default async function BetriebskostenPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("abrechnungseinheiten")
    .select(SELECT)
    .order("bezeichnung", { ascending: true })

  const einheiten = (data ?? []) as unknown as AbrechnungseinheitMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Betriebskosten</h1>
          <p className="text-muted-foreground text-sm">
            {einheiten.length}{" "}
            {einheiten.length === 1 ? "Abrechnungseinheit" : "Abrechnungseinheiten"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href="/betriebskosten/positionen" />}
          >
            <Receipt />
            <span>Kostenpositionen</span>
          </Button>
          <Button render={<Link href="/betriebskosten/neu" />}>
            <Plus />
            <span>Neue Abrechnungseinheit</span>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : einheiten.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Calculator className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Abrechnungseinheiten</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste Abrechnungseinheit an, um Betriebskosten umzulegen.
            </p>
          </div>
          <Button render={<Link href="/betriebskosten/neu" />} variant="outline">
            <Plus />
            <span>Abrechnungseinheit anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Objekt</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Schlüssel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {einheiten.map((ae) => (
                    <TableRow key={ae.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/betriebskosten/${ae.id}`}
                          className="hover:underline"
                        >
                          {ae.bezeichnung}
                        </Link>
                      </TableCell>
                      <TableCell>{ae.objekt?.kuerzel ?? "–"}</TableCell>
                      <TableCell>{ae.typ ?? "–"}</TableCell>
                      <TableCell>
                        {ae.standard_schluessel
                          ? (BK_SCHLUESSEL_LABELS[ae.standard_schluessel] ??
                            ae.standard_schluessel)
                          : "–"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ae.aktiv === false ? "inaktiv" : "aktiv"}>
                          {ae.aktiv === false ? "Inaktiv" : "Aktiv"}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="space-y-2 md:hidden">
            {einheiten.map((ae) => (
              <Link
                key={ae.id}
                href={`/betriebskosten/${ae.id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Calculator className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {ae.bezeichnung}
                        </span>
                        <StatusBadge
                          status={ae.aktiv === false ? "inaktiv" : "aktiv"}
                        >
                          {ae.aktiv === false ? "Inaktiv" : "Aktiv"}
                        </StatusBadge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Objekt: {ae.objekt?.kuerzel ?? "–"}</span>
                        {ae.typ ? <span>{ae.typ}</span> : null}
                        {ae.standard_schluessel ? (
                          <span>
                            {BK_SCHLUESSEL_LABELS[ae.standard_schluessel] ??
                              ae.standard_schluessel}
                          </span>
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
