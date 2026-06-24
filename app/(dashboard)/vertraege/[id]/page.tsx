import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoVertrag } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteVertragButton } from "@/components/vertraege/delete-vertrag-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  VERTRAGSART_LABELS,
  VERTRAG_STATUS_LABELS,
  warmmiete,
  type VertragMitRelationen,
} from "@/types/vertrag"
import {
  MAHN_STATUS_LABELS,
  MAHN_STATUS_VARIANT,
  MAHN_STUFE_LABELS,
  type Mahnung,
} from "@/types/mahnung"
import {
  KAUTION_ANLAGE_ART_LABELS,
  KAUTION_STATUS_LABELS,
  type Kaution,
} from "@/types/kaution"

const SELECT =
  "*, objekt:objekte(kuerzel, bezeichnung), einheit:einheiten(verwendungszweck_code, bezeichnung), mieter:kontakte(vorname, nachname, firma)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function VertragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("vertraege")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  let vertrag = data as unknown as VertragMitRelationen | null

  if (!vertrag && isPreviewNoAuth()) {
    vertrag = findDemoVertrag(id) ?? null
  }

  if (!vertrag) {
    notFound()
  }

  // Zugehörige Finanzdatensätze laden (nicht in der Vorschau ohne DB).
  const [{ data: mahnungenData }, { data: kautionData }] = await Promise.all([
    supabase
      .from("mahnungen")
      .select("*")
      .eq("vertrag_id", id)
      .order("faellig_am", { ascending: false, nullsFirst: false }),
    supabase
      .from("kautionen")
      .select("*")
      .eq("vertrag_id", id)
      .order("created_at", { ascending: false })
      .maybeSingle(),
  ])
  const mahnungen = (mahnungenData ?? []) as Mahnung[]
  const kaution = kautionData as Kaution | null

  const titel =
    vertrag.vertragsnummer ??
    (vertrag.vertragsart
      ? (VERTRAGSART_LABELS[vertrag.vertragsart] ?? vertrag.vertragsart)
      : "Vertrag")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/vertraege"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Verträge
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <StatusBadge status={vertrag.status}>
                {VERTRAG_STATUS_LABELS[vertrag.status] ?? vertrag.status}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {vertrag.mieter ? kontaktName(vertrag.mieter) : "Kein Mieter"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/vertraege/${vertrag.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteVertragButton id={vertrag.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vertragsdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Vertragsart"
                value={
                  vertrag.vertragsart
                    ? (VERTRAGSART_LABELS[vertrag.vertragsart] ??
                      vertrag.vertragsart)
                    : null
                }
              />
              <Field label="Vertragsnummer" value={vertrag.vertragsnummer} />
              <Field
                label="Mieter"
                value={
                  vertrag.mieter_id ? (
                    <Link
                      href={`/kontakte/${vertrag.mieter_id}`}
                      className="hover:underline"
                    >
                      {vertrag.mieter ? kontaktName(vertrag.mieter) : "Kontakt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Objekt"
                value={
                  vertrag.objekt_id ? (
                    <Link
                      href={`/objekte/${vertrag.objekt_id}`}
                      className="hover:underline"
                    >
                      {vertrag.objekt?.kuerzel ?? "Objekt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Einheit"
                value={
                  vertrag.einheit_id ? (
                    <Link
                      href={`/einheiten/${vertrag.einheit_id}`}
                      className="hover:underline"
                    >
                      {vertrag.einheit?.verwendungszweck_code ?? "Einheit"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Laufzeit"
                value={
                  vertrag.unbefristet
                    ? `seit ${formatDate(vertrag.beginn)} · unbefristet`
                    : `${formatDate(vertrag.beginn)} – ${formatDate(vertrag.ende)}`
                }
              />
              <Field
                label="Fälligkeit"
                value={vertrag.faelligkeitsregel}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Miete</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Grundmiete" value={formatEUR(vertrag.grundmiete)} />
              <Field
                label="BK-Pauschale"
                value={formatEUR(vertrag.bk_pauschale)}
              />
              <Field
                label="Heizkosten"
                value={formatEUR(vertrag.heizkosten_pauschale)}
              />
              <Field label="Strom" value={formatEUR(vertrag.strompauschale)} />
              <Field
                label="Warmmiete"
                value={
                  <span className="font-medium">
                    {formatEUR(warmmiete(vertrag))}
                  </span>
                }
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Kaution</CardTitle>
            {!kaution ? (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    href={`/finanzen/kautionen/neu?vertrag=${vertrag.id}`}
                  />
                }
              >
                <Plus />
                <span>Neu</span>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {kaution ? (
              <Link
                href={`/finanzen/kautionen/${kaution.id}`}
                className="block"
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Betrag" value={formatEUR(kaution.betrag)} />
                  <Field
                    label="Anlageart"
                    value={
                      kaution.anlage_art
                        ? (KAUTION_ANLAGE_ART_LABELS[kaution.anlage_art] ??
                          kaution.anlage_art)
                        : null
                    }
                  />
                  <Field
                    label="Status"
                    value={
                      <StatusBadge status={kaution.status}>
                        {KAUTION_STATUS_LABELS[kaution.status] ?? kaution.status}
                      </StatusBadge>
                    }
                  />
                  <Field label="Bank" value={kaution.bank} />
                </dl>
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">
                Keine Kaution hinterlegt.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Mahnungen</CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/finanzen/mahnungen/neu?vertrag=${vertrag.id}`} />
              }
            >
              <Plus />
              <span>Neu</span>
            </Button>
          </CardHeader>
          <CardContent>
            {mahnungen.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Keine Mahnungen vorhanden.
              </p>
            ) : (
              <ul className="flex flex-col">
                {mahnungen.map((m, index) => (
                  <li key={m.id}>
                    <Link
                      href={`/finanzen/mahnungen/${m.id}`}
                      className={`flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40 ${
                        index !== mahnungen.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div className="grid flex-1 gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium leading-tight">
                            {MAHN_STUFE_LABELS[m.stufe] ?? `Stufe ${m.stufe}`}
                          </span>
                          <Badge
                            variant={
                              MAHN_STATUS_VARIANT[m.status] ?? "secondary"
                            }
                            className="shrink-0 text-[0.7rem]"
                          >
                            {MAHN_STATUS_LABELS[m.status] ?? m.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Fällig: {formatDate(m.faellig_am)}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {formatEUR(m.gesamt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
