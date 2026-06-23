import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteKautionButton } from "@/components/kautionen/delete-kaution-button"
import { formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  KAUTION_ANLAGE_ART_LABELS,
  KAUTION_STATUS_LABELS,
  KAUTION_STATUS_VARIANT,
  type KautionMitRelationen,
} from "@/types/kaution"

const SELECT =
  "*, vertrag:vertraege(vertragsnummer), mieter:kontakte(vorname, nachname, firma)"

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
    .from("kautionen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const kaution = data as unknown as KautionMitRelationen | null

  if (!kaution) {
    notFound()
  }

  const titel = kaution.mieter ? kontaktName(kaution.mieter) : "Kaution"

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
              <Badge
                variant={KAUTION_STATUS_VARIANT[kaution.status] ?? "secondary"}
              >
                {KAUTION_STATUS_LABELS[kaution.status] ?? kaution.status}
              </Badge>
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
                label="Mieter"
                value={
                  kaution.mieter_id ? (
                    <Link
                      href={`/kontakte/${kaution.mieter_id}`}
                      className="hover:underline"
                    >
                      {kaution.mieter ? kontaktName(kaution.mieter) : "Kontakt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Vertrag"
                value={
                  kaution.vertrag_id ? (
                    <Link
                      href={`/vertraege/${kaution.vertrag_id}`}
                      className="hover:underline"
                    >
                      {kaution.vertrag?.vertragsnummer ?? "Vertrag"}
                    </Link>
                  ) : null
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bankverbindung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Bank" value={kaution.bank} />
              <Field label="IBAN" value={kaution.iban} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
