import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteKautionButton } from "@/components/kautionen/delete-kaution-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import {
  KAUTION_ANLAGE_ART_LABELS,
  KAUTION_STATUS_LABELS,
  type KautionMitRelationen,
} from "@/types/kaution"

const SELECT = "*, vertrag:mietvertraege(aktenzeichen)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function KautionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("kautionen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const kaution = data as unknown as KautionMitRelationen | null

  if (!kaution) {
    notFound()
  }

  const titel = kaution.vertrag?.aktenzeichen
    ? `Kaution ${kaution.vertrag.aktenzeichen}`
    : "Kaution"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/finanzen/kautionen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kautionen
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <StatusBadge status={kaution.status}>
                {KAUTION_STATUS_LABELS[kaution.status] ?? kaution.status}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {formatEUR(kaution.betrag)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={
                <Link href={`/finanzen/kautionen/${kaution.id}/bearbeiten`} />
              }
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteKautionButton id={kaution.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kautionsdaten</CardTitle>
          </CardHeader>
          <CardContent>
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
                label="Zinssatz"
                value={
                  kaution.zinssatz != null ? `${kaution.zinssatz} %` : null
                }
              />
              <Field
                label="Vertrag"
                value={
                  kaution.mietvertrag_id ? (
                    <Link
                      href={`/vertraege/${kaution.mietvertrag_id}`}
                      className="hover:underline"
                    >
                      {kaution.vertrag?.aktenzeichen ?? "Vertrag"}
                    </Link>
                  ) : null
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verzinsung &amp; Rückzahlung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Zinsen kumuliert"
                value={formatEUR(kaution.zinsen_kumuliert)}
              />
              <Field
                label="Rückzahlung am"
                value={formatDate(kaution.rueckzahlung_datum)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
