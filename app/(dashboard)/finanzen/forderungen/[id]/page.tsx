import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteForderungButton } from "@/components/forderungen/delete-forderung-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { offenerBetrag, schadenEskalation } from "@/lib/utils/forderungen"
import { kontaktName } from "@/types/kontakt"
import {
  FORDERUNG_STATUS_LABELS,
  FORDERUNG_TYP_LABELS,
  type ForderungMitRelationen,
} from "@/types/forderung"

const SELECT =
  "*, kontakt:kontakte!kontakt_id(vorname, nachname, firmenname), mietvertrag:mietvertraege(aktenzeichen)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function ForderungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("forderungen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const forderung = data as unknown as ForderungMitRelationen | null

  if (!forderung) {
    notFound()
  }

  const titel = forderung.kontakt
    ? kontaktName(forderung.kontakt)
    : "Forderung"
  const eskalation =
    forderung.forderung_typ === "sachschaden"
      ? schadenEskalation(forderung.betrag ?? 0)
      : null

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/finanzen/forderungen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Forderungen
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <StatusBadge status={forderung.status}>
                {FORDERUNG_STATUS_LABELS[forderung.status] ?? forderung.status}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {FORDERUNG_TYP_LABELS[forderung.forderung_typ] ??
                forderung.forderung_typ}{" "}
              · {formatEUR(forderung.betrag)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={
                <Link
                  href={`/finanzen/forderungen/${forderung.id}/bearbeiten`}
                />
              }
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteForderungButton id={forderung.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forderungsdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Kontakt"
                value={
                  forderung.kontakt_id ? (
                    <Link
                      href={`/kontakte/${forderung.kontakt_id}`}
                      className="hover:underline"
                    >
                      {forderung.kontakt
                        ? kontaktName(forderung.kontakt)
                        : "Kontakt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Forderungsart"
                value={
                  FORDERUNG_TYP_LABELS[forderung.forderung_typ] ??
                  forderung.forderung_typ
                }
              />
              <Field label="Betrag" value={formatEUR(forderung.betrag)} />
              <Field
                label="Offen"
                value={formatEUR(offenerBetrag(forderung))}
              />
              <Field
                label="Bereits bezahlt"
                value={formatEUR(forderung.bezahlt_betrag)}
              />
              <Field label="Fällig am" value={formatDate(forderung.faellig_am)} />
              <Field
                label="Bezahlt am"
                value={formatDate(forderung.bezahlt_am)}
              />
              {forderung.schaden_typ ? (
                <Field label="Schadensart" value={forderung.schaden_typ} />
              ) : null}
              <Field
                label="Vertrag"
                value={
                  forderung.mietvertrag_id ? (
                    <Link
                      href={`/vertraege/${forderung.mietvertrag_id}`}
                      className="hover:underline"
                    >
                      {forderung.mietvertrag?.aktenzeichen ?? "Vertrag"}
                    </Link>
                  ) : null
                }
              />
              <Field label="Aktenzeichen" value={forderung.aktenzeichen} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {eskalation ? "Schadensmanagement" : "Verrechnung & Notiz"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {eskalation ? (
                <Field
                  label="Empfehlung"
                  value={`${eskalation.label} (Stufe ${eskalation.stufe})`}
                />
              ) : null}
              <Field
                label="Kaution verrechnet"
                value={forderung.kaution_verrechnet ? "Ja" : "Nein"}
              />
              <Field
                label="Kautionsbetrag"
                value={formatEUR(forderung.kaution_betrag)}
              />
              <Field
                label="Mahnstufe"
                value={
                  forderung.mahnstufe != null
                    ? String(forderung.mahnstufe)
                    : null
                }
              />
            </dl>
            {forderung.notiz ? (
              <p className="text-muted-foreground mt-4 text-sm whitespace-pre-wrap">
                {forderung.notiz}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
