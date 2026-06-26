import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteGesellschafterButton } from "@/components/fibu/delete-gesellschafter-button"
import {
  BeteiligungForm,
  type FirmaOption,
} from "@/components/fibu/beteiligung-form"
import { DeleteBeteiligungButton } from "@/components/fibu/delete-beteiligung-button"
import { formatDate } from "@/lib/utils/format"
import {
  GESELLSCHAFTER_TYP_LABELS,
  type BeteiligungMitFirma,
  type Gesellschafter,
} from "@/types/gesellschafter"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function GesellschafterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: gData }, { data: bData }, { data: fData }] = await Promise.all([
    supabase.from("gesellschafter").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("beteiligungen")
      .select("*, firma:firmen(id, name, kuerzel)")
      .eq("gesellschafter_id", id)
      .order("gueltig_ab", { ascending: false }),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
  ])

  const g = gData as Gesellschafter | null
  if (!g) notFound()

  const beteiligungen = (bData ?? []) as BeteiligungMitFirma[]
  const firmen = (fData ?? []) as FirmaOption[]
  const heute = new Date().toISOString().slice(0, 10)

  function istAktiv(b: BeteiligungMitFirma) {
    return (
      b.gueltig_ab <= heute && (b.gueltig_bis === null || b.gueltig_bis >= heute)
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/gesellschafter"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Gesellschaftern
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{g.name}</h1>
            <p className="text-muted-foreground text-sm">
              {GESELLSCHAFTER_TYP_LABELS[g.typ] ?? g.typ}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              render={<Link href={`/fibu/gesellschafter/${g.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteGesellschafterButton id={g.id} label={g.name} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Field
              label="Typ"
              value={GESELLSCHAFTER_TYP_LABELS[g.typ] ?? g.typ}
            />
            <Field label="Steuerliche ID" value={g.steuerliche_id} />
            <Field
              label="Adresse"
              value={
                [g.strasse, g.hausnummer].filter(Boolean).join(" ") || null
              }
            />
            <Field
              label="Ort"
              value={[g.plz, g.stadt].filter(Boolean).join(" ") || null}
            />
            <Field label="Land" value={g.land} />
            <Field
              label="Status"
              value={
                <StatusBadge status={g.aktiv ? "aktiv" : "inaktiv"}>
                  {g.aktiv ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Beteiligungen</CardTitle>
            <p className="text-muted-foreground mt-1 text-xs">
              Zeitabhängige Quoten je Firma – Basis der periodengenauen
              Ergebnisverteilung.
            </p>
          </div>
          <BeteiligungForm gesellschafterId={g.id} firmen={firmen} />
        </CardHeader>
        <CardContent>
          {beteiligungen.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Noch keine Beteiligungen zugeordnet.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    <TableHead className="text-right">Quote</TableHead>
                    <TableHead>Gültig ab</TableHead>
                    <TableHead>Gültig bis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beteiligungen.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.firma?.name ?? "–"}
                        {b.firma?.kuerzel ? (
                          <span className="text-muted-foreground">
                            {" "}
                            ({b.firma.kuerzel})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(b.quote * 100).toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        %
                      </TableCell>
                      <TableCell>{formatDate(b.gueltig_ab)}</TableCell>
                      <TableCell>
                        {b.gueltig_bis ? formatDate(b.gueltig_bis) : "offen"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={istAktiv(b) ? "aktiv" : "inaktiv"}>
                          {istAktiv(b) ? "Aktuell" : "Inaktiv"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <BeteiligungForm
                            gesellschafterId={g.id}
                            firmen={firmen}
                            beteiligung={b}
                          />
                          <DeleteBeteiligungButton id={b.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
