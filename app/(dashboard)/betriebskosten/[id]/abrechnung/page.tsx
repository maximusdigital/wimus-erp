import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
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
import {
  erstelleAbrechnung,
  type BkAbrechnungMitglied,
  type BkPosition,
} from "@/lib/utils/bk-abrechnung"
import type { Umlageschluessel } from "@/lib/utils/bk"
import { BK_SCHLUESSEL_LABELS } from "@/types/bk-art"
import type {
  AbrechnungseinheitMitRelationen,
  KostenpositionMitRelationen,
  MitgliedMitRelationen,
} from "@/types/betriebskosten"

export const metadata = {
  title: "BK-Abrechnung",
}

const AE_SELECT = "*, objekt:objekte(kuerzel, stadt)"
const MITGLIED_SELECT =
  "*, einheit:einheiten(verwendungszweck_code, flaeche), mietvertrag:mietvertraege!mietvertrag_id(aktenzeichen, bk_pauschale)"

function isUmlageschluessel(v: string | null): v is Umlageschluessel {
  return (
    v === "kopfzahl" ||
    v === "flaeche" ||
    v === "einheit" ||
    v === "verbrauch" ||
    v === "miteigentum" ||
    v === "individuell"
  )
}

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

  const { data: aeData } = await supabase
    .from("abrechnungseinheiten")
    .select(AE_SELECT)
    .eq("id", id)
    .maybeSingle()

  const ae = aeData as unknown as AbrechnungseinheitMitRelationen | null
  if (!ae) {
    notFound()
  }

  const standardSchluessel: Umlageschluessel = isUmlageschluessel(
    ae.standard_schluessel
  )
    ? ae.standard_schluessel
    : "flaeche"

  // Mitglieder (mit Fläche + Mietvertrag-Pauschale).
  const { data: mitgliederData } = await supabase
    .from("abrechnungseinheit_mitglieder")
    .select(MITGLIED_SELECT)
    .eq("abrechnungseinheit_id", id)
    .order("created_at", { ascending: true })

  const mitglieder = (mitgliederData ?? []) as unknown as MitgliedMitRelationen[]

  // Kostenpositionen dieser Abrechnungseinheit (optional auf Periode gefiltert).
  let posQuery = supabase
    .from("kostenverteilung_positionen")
    .select("*, bk_art:bk_arten(bezeichnung, kategorie, standard_schluessel)")
    .eq("abrechnungseinheit_id", id)

  if (period) posQuery = posQuery.eq("abrechnungsperiode", period)

  const { data: posData } = await posQuery
  const positionenRows = (posData ?? []) as unknown as KostenpositionMitRelationen[]

  // Inputs für erstelleAbrechnung bauen.
  const mitgliederInput: BkAbrechnungMitglied[] = mitglieder.map((m) => ({
    id: m.mietvertrag_id ?? m.einheit_id,
    wert: m.einheit?.flaeche ?? 0,
    fester_anteil_pct: m.fester_anteil_pct,
    intern_abgerechnet: m.intern_abgerechnet,
    vorauszahlung: (m.mietvertrag?.bk_pauschale ?? 0) * 12,
  }))

  const positionenInput: BkPosition[] = positionenRows.map((p) => ({
    id: p.id,
    bk_art_id: p.bk_art_id,
    betrag: p.betrag_brutto ?? 0,
    schluessel: null,
  }))

  const ergebnis = erstelleAbrechnung(
    positionenInput,
    mitgliederInput,
    standardSchluessel
  )

  // Mapping id → Mitglied (für die Anzeige Vertrag/Einheit).
  const labelById = new Map<string, MitgliedMitRelationen>()
  for (const m of mitglieder) {
    labelById.set(m.mietvertrag_id ?? m.einheit_id, m)
  }

  function zeileLabel(zeileId: string): string {
    const m = labelById.get(zeileId)
    if (!m) return zeileId
    if (m.mietvertrag?.aktenzeichen) return m.mietvertrag.aktenzeichen
    return m.einheit?.verwendungszweck_code ?? "Einheit"
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
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
          Vorschau · Umlageschlüssel:{" "}
          {BK_SCHLUESSEL_LABELS[standardSchluessel] ?? standardSchluessel}
          {period ? ` · Periode ${period}` : ""}
        </p>
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
              {formatEUR(
                ergebnis.vorauszahlungGesamt - ergebnis.kostenGesamt
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {mitglieder.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Mitglieder zugeordnet – bitte zuerst Mitglieder anlegen.
        </div>
      ) : positionenRows.length === 0 ? (
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
                    {zeileLabel(z.id)}
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
                      z.saldo > 0
                        ? "text-success"
                        : z.saldo < 0
                          ? "text-danger"
                          : ""
                    )}
                  >
                    {formatEUR(z.saldo)}
                    {z.saldo > 0
                      ? " (Guthaben)"
                      : z.saldo < 0
                        ? " (Nachzahlung)"
                        : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Read-only Vorschau. Speichern folgt.
      </p>
    </div>
  )
}
