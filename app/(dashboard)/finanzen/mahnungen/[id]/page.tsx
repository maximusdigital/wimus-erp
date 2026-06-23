import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteMahnungButton } from "@/components/mahnungen/delete-mahnung-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  MAHN_STATUS_LABELS,
  MAHN_STATUS_VARIANT,
  MAHN_STUFE_LABELS,
  type MahnungMitRelationen,
} from "@/types/mahnung"

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

export default async function MahnungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("mahnungen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const mahnung = data as unknown as MahnungMitRelationen | null

  if (!mahnung) {
    notFound()
  }

  const titel = MAHN_STUFE_LABELS[mahnung.stufe] ?? `Stufe ${mahnung.stufe}`

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/finanzen/mahnungen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Mahnungen
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <Badge
                variant={MAHN_STATUS_VARIANT[mahnung.status] ?? "secondary"}
              >
                {MAHN_STATUS_LABELS[mahnung.status] ?? mahnung.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {mahnung.mieter ? kontaktName(mahnung.mieter) : "Kein Mieter"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={
                <Link href={`/finanzen/mahnungen/${mahnung.id}/bearbeiten`} />
              }
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteMahnungButton id={mahnung.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mahndaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Stufe" value={titel} />
              <Field
                label="Mieter"
                value={
                  mahnung.mieter_id ? (
                    <Link
                      href={`/kontakte/${mahnung.mieter_id}`}
                      className="hover:underline"
                    >
                      {mahnung.mieter ? kontaktName(mahnung.mieter) : "Kontakt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Vertrag"
                value={
                  mahnung.vertrag_id ? (
                    <Link
                      href={`/vertraege/${mahnung.vertrag_id}`}
                      className="hover:underline"
                    >
                      {mahnung.vertrag?.vertragsnummer ?? "Vertrag"}
                    </Link>
                  ) : null
                }
              />
              <Field label="Fällig am" value={formatDate(mahnung.faellig_am)} />
              <Field
                label="Versendet am"
                value={formatDate(mahnung.versendet_am)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forderung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Hauptforderung"
                value={formatEUR(mahnung.hauptforderung)}
              />
              <Field label="Zinsen" value={formatEUR(mahnung.zinsen)} />
              <Field label="Gebühren" value={formatEUR(mahnung.gebuehren)} />
              <Field
                label="Gesamt"
                value={
                  <span className="font-medium">
                    {formatEUR(mahnung.gesamt)}
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
