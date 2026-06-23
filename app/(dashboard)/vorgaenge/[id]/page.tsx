import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteVorgangButton } from "@/components/vorgaenge/delete-vorgang-button"
import { formatDate } from "@/lib/utils/format"
import {
  einheitLabel,
  VORGANG_KOSTENTRAEGER_LABELS,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_PRIORITAET_VARIANT,
  VORGANG_STATUS_LABELS,
  VORGANG_STATUS_VARIANT,
  VORGANG_TYP_LABELS,
  type VorgangMitRelationen,
} from "@/types/vorgang"

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function VorgangDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("vorgaenge")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const vorgang = data as unknown as VorgangMitRelationen | null

  if (!vorgang) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/vorgaenge"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Vorgänge
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {vorgang.titel}
              </h1>
              <Badge
                variant={
                  VORGANG_STATUS_VARIANT[vorgang.status] ?? "secondary"
                }
              >
                {VORGANG_STATUS_LABELS[vorgang.status] ?? vorgang.status}
              </Badge>
              <Badge
                variant={
                  VORGANG_PRIORITAET_VARIANT[vorgang.prioritaet] ?? "secondary"
                }
              >
                {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ??
                  vorgang.prioritaet}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {vorgang.typ
                ? (VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ)
                : "Vorgang"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/vorgaenge/${vorgang.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteVorgangButton id={vorgang.id} label={vorgang.titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vorgang</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Typ"
                value={
                  vorgang.typ
                    ? (VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ)
                    : null
                }
              />
              <Field
                label="Priorität"
                value={
                  <Badge
                    variant={
                      VORGANG_PRIORITAET_VARIANT[vorgang.prioritaet] ??
                      "secondary"
                    }
                  >
                    {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ??
                      vorgang.prioritaet}
                  </Badge>
                }
              />
              <Field
                label="Status"
                value={
                  <Badge
                    variant={
                      VORGANG_STATUS_VARIANT[vorgang.status] ?? "secondary"
                    }
                  >
                    {VORGANG_STATUS_LABELS[vorgang.status] ?? vorgang.status}
                  </Badge>
                }
              />
              <Field label="Fällig am" value={formatDate(vorgang.faellig_am)} />
              <Field
                label="Kostenträger"
                value={
                  vorgang.kostentraeger
                    ? (VORGANG_KOSTENTRAEGER_LABELS[vorgang.kostentraeger] ??
                      vorgang.kostentraeger)
                    : null
                }
              />
              <Field label="Erstellt" value={formatDate(vorgang.created_at)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bezug</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Objekt"
                value={
                  vorgang.objekt_id ? (
                    <Link
                      href={`/objekte/${vorgang.objekt_id}`}
                      className="hover:underline"
                    >
                      {vorgang.objekt?.kuerzel ?? "Objekt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Einheit"
                value={
                  vorgang.einheit_id ? (
                    <Link
                      href={`/einheiten/${vorgang.einheit_id}`}
                      className="hover:underline"
                    >
                      {einheitLabel(vorgang.einheit) ?? "Einheit"}
                    </Link>
                  ) : null
                }
              />
            </dl>
          </CardContent>
        </Card>

        {vorgang.beschreibung ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {vorgang.beschreibung}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
