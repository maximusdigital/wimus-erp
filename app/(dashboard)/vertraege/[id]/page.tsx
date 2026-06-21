import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoVertrag } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteVertragButton } from "@/components/vertraege/delete-vertrag-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  VERTRAGSART_LABELS,
  VERTRAG_STATUS_LABELS,
  VERTRAG_STATUS_VARIANT,
  warmmiete,
  type VertragMitRelationen,
} from "@/types/vertrag"

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
              <Badge
                variant={VERTRAG_STATUS_VARIANT[vertrag.status] ?? "secondary"}
              >
                {VERTRAG_STATUS_LABELS[vertrag.status] ?? vertrag.status}
              </Badge>
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
    </div>
  )
}
