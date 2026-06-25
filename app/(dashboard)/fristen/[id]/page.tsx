import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteFristButton } from "@/components/fristen/delete-frist-button"
import { AmpelDot } from "@/components/fristen/frist-tabelle"
import { formatDate } from "@/lib/utils/format"
import { tageBisFaellig } from "@/lib/utils/fristen"
import {
  FRIST_STATUS_LABELS,
  FRIST_TYP_LABELS,
  type Frist,
} from "@/types/frist"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function FristDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const heute = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from("fristen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const frist = data as Frist | null

  if (!frist) {
    notFound()
  }

  const titel =
    frist.bezeichnung || FRIST_TYP_LABELS[frist.frist_typ] || "Frist"
  const tage = tageBisFaellig(frist.faellig_am, heute)
  const restText =
    tage === null
      ? null
      : tage < 0
        ? `${Math.abs(tage)} Tage überfällig`
        : tage === 0
          ? "heute fällig"
          : `in ${tage} Tagen`

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fristen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Fristen
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AmpelDot
                faellig_am={frist.faellig_am}
                heute={heute}
                status={frist.status}
              />
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <StatusBadge status={frist.status}>
                {FRIST_STATUS_LABELS[frist.status] ?? frist.status}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {FRIST_TYP_LABELS[frist.frist_typ] ?? frist.frist_typ} ·{" "}
              {formatDate(frist.faellig_am)}
              {restText ? ` · ${restText}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/fristen/${frist.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteFristButton id={frist.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fristdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Fristtyp"
                value={FRIST_TYP_LABELS[frist.frist_typ] ?? frist.frist_typ}
              />
              <Field label="Bezeichnung" value={frist.bezeichnung} />
              <Field label="Start-Datum" value={formatDate(frist.start_datum)} />
              <Field label="Fällig am" value={formatDate(frist.faellig_am)} />
              <Field label="Aktionstyp" value={frist.aktion_typ} />
              <Field label="Erledigt am" value={formatDate(frist.erledigt_am)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Erinnerung &amp; Bezug</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Erinnerung (Tage vorher)"
                value={
                  frist.erinnerung_tage_vorher?.length
                    ? frist.erinnerung_tage_vorher.join(", ")
                    : null
                }
              />
              <Field label="Bezugstyp" value={frist.bezug_typ} />
              <Field
                label="Automatisch erstellt"
                value={frist.automatisch_erstellt ? "Ja" : "Nein"}
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
