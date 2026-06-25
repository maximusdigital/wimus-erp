import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, FileSpreadsheet, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import {
  loadEinheitOptions,
  loadMietvertragOptions,
} from "@/lib/betriebskosten-options"
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
import { DeleteAbrechnungseinheitButton } from "@/components/betriebskosten/delete-abrechnungseinheit-button"
import { MitgliedForm } from "@/components/betriebskosten/mitglied-form"
import { DeleteMitgliedButton } from "@/components/betriebskosten/delete-mitglied-button"
import { BK_SCHLUESSEL_LABELS } from "@/types/bk-art"
import type {
  AbrechnungseinheitMitRelationen,
  MitgliedMitRelationen,
} from "@/types/betriebskosten"

const SELECT = "*, objekt:objekte(kuerzel, stadt)"
const MITGLIED_SELECT =
  "*, einheit:einheiten(verwendungszweck_code, flaeche), mietvertrag:mietvertraege!mietvertrag_id(aktenzeichen)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function AbrechnungseinheitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("abrechnungseinheiten")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const ae = data as unknown as AbrechnungseinheitMitRelationen | null

  if (!ae) {
    notFound()
  }

  const { data: mitgliederData } = await supabase
    .from("abrechnungseinheit_mitglieder")
    .select(MITGLIED_SELECT)
    .eq("abrechnungseinheit_id", id)
    .order("created_at", { ascending: true })

  const mitglieder = (mitgliederData ?? []) as unknown as MitgliedMitRelationen[]

  const [einheiten, mietvertraege] = await Promise.all([
    loadEinheitOptions(ae.objekt_id),
    loadMietvertragOptions(),
  ])

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
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {ae.bezeichnung}
              </h1>
              <StatusBadge status={ae.aktiv === false ? "inaktiv" : "aktiv"}>
                {ae.aktiv === false ? "Inaktiv" : "Aktiv"}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {ae.objekt?.kuerzel ?? "Objekt"} ·{" "}
              {ae.standard_schluessel
                ? (BK_SCHLUESSEL_LABELS[ae.standard_schluessel] ??
                  ae.standard_schluessel)
                : "kein Standard-Schlüssel"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href={`/betriebskosten/${ae.id}/abrechnung`} />}
            >
              <FileSpreadsheet />
              <span>Abrechnung anzeigen</span>
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/betriebskosten/${ae.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteAbrechnungseinheitButton id={ae.id} label={ae.bezeichnung} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <Field
              label="Objekt"
              value={
                <Link
                  href={`/objekte/${ae.objekt_id}`}
                  className="hover:underline"
                >
                  {ae.objekt?.kuerzel ?? "Objekt"}
                </Link>
              }
            />
            <Field label="Typ" value={ae.typ} />
            <Field
              label="Standard-Schlüssel"
              value={
                ae.standard_schluessel
                  ? (BK_SCHLUESSEL_LABELS[ae.standard_schluessel] ??
                    ae.standard_schluessel)
                  : null
              }
            />
            <Field
              label="Status"
              value={ae.aktiv === false ? "Inaktiv" : "Aktiv"}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Mitglieder ({mitglieder.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mitglieder.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Noch keine Mitglieder zugeordnet.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Einheit</TableHead>
                    <TableHead className="text-right">Fläche</TableHead>
                    <TableHead>Vertrag</TableHead>
                    <TableHead>Intern?</TableHead>
                    <TableHead>Aktiv</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mitglieder.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.einheit?.verwendungszweck_code ?? "–"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.einheit?.flaeche != null
                          ? `${m.einheit.flaeche} m²`
                          : "–"}
                      </TableCell>
                      <TableCell>{m.mietvertrag?.aktenzeichen ?? "–"}</TableCell>
                      <TableCell>
                        {m.intern_abgerechnet ? "Ja" : "Nein"}
                      </TableCell>
                      <TableCell>{m.aktiv === false ? "Nein" : "Ja"}</TableCell>
                      <TableCell>
                        <DeleteMitgliedButton
                          abrechnungseinheitId={ae.id}
                          mitgliedId={m.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Mitglied hinzufügen</p>
            <MitgliedForm
              abrechnungseinheitId={ae.id}
              einheiten={einheiten}
              mietvertraege={mietvertraege}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
