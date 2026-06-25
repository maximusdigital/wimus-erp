import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { ladeAbrechnungslauf, zeileLabel } from "@/lib/betriebskosten-run"
import { AbrechnungAktionen } from "@/components/betriebskosten/abrechnung-aktionen"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatEUR } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { BK_SCHLUESSEL_LABELS } from "@/types/bk-art"

export const metadata = { title: "BK-Abrechnung" }

export default async function AbrechnungPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id } = await params
  const { period } = await searchParams
  const supabase = await createServerClient()

  const lauf = await ladeAbrechnungslauf(supabase, id, period)
  if (!lauf) notFound()

  const { ae, ergebnis, mitglieder, mitgliedById, positionen, standardSchluessel } = lauf
  const speicherbar = mitglieder.length > 0 && positionen.length > 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/betriebskosten/${ae.id}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="size-4" />
            Zurück zur Abrechnungseinheit
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            BK-Abrechnung – {ae.bezeichnung}
          </h1>
          <p className="text-muted-foreground text-sm">
            Umlageschlüssel:{" "}
            {BK_SCHLUESSEL_LABELS[standardSchluessel] ?? standardSchluessel}
            {period ? ` · Periode ${period}` : ""}
          </p>
        </div>
        <AbrechnungAktionen
          abrechnungseinheitId={ae.id}
          period={period}
          disabled={!speicherbar}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Kosten gesamt</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatEUR(ergebnis.kostenGesamt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Vorauszahlungen gesamt</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatEUR(ergebnis.vorauszahlungGesamt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Saldo gesamt</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                ergebnis.vorauszahlungGesamt - ergebnis.kostenGesamt >= 0
                  ? "text-success"
                  : "text-danger"
              )}
            >
              {formatEUR(ergebnis.vorauszahlungGesamt - ergebnis.kostenGesamt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {mitglieder.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Mitglieder zugeordnet – bitte zuerst Mitglieder anlegen.
        </div>
      ) : positionen.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Kostenpositionen für diese Abrechnungseinheit
          {period ? ` (Periode ${period})` : ""}.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mietvertrag / Einheit</TableHead>
                <TableHead className="text-right">Kostenanteil</TableHead>
                <TableHead className="text-right">Vorauszahlung</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ergebnis.zeilen.map((z) => (
                <TableRow key={z.id}>
                  <TableCell className="font-medium">
                    {zeileLabel(mitgliedById.get(z.id), z.id)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEUR(z.kostenAnteil)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEUR(z.vorauszahlung)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      z.saldo > 0 ? "text-success" : z.saldo < 0 ? "text-danger" : ""
                    )}
                  >
                    {formatEUR(z.saldo)}
                    {z.saldo > 0 ? " (Guthaben)" : z.saldo < 0 ? " (Nachzahlung)" : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
