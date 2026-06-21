import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoKontakt } from "@/lib/dev/demo-kontakte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteKontaktButton } from "@/components/kontakte/delete-kontakt-button"
import { formatAdresse, formatDate } from "@/lib/utils/format"
import {
  KONTAKT_TYP_LABELS,
  KONTAKT_TYP_VARIANT,
  kontaktName,
  type Kontakt,
} from "@/types/kontakt"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function KontaktDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("kontakte")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  let kontakt = data as Kontakt | null

  if (!kontakt && isPreviewNoAuth()) {
    kontakt = findDemoKontakt(id) ?? null
  }

  if (!kontakt) {
    notFound()
  }

  const name = kontaktName(kontakt)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/kontakte"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kontakte
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{name}</h1>
              <Badge variant={KONTAKT_TYP_VARIANT[kontakt.typ] ?? "secondary"}>
                {KONTAKT_TYP_LABELS[kontakt.typ] ?? kontakt.typ}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {kontakt.email ?? formatAdresse(kontakt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/kontakte/${kontakt.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteKontaktButton id={kontakt.id} name={name} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontaktdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Anrede" value={kontakt.anrede} />
              <Field label="Firma" value={kontakt.firma} />
              <Field label="Vorname" value={kontakt.vorname} />
              <Field label="Nachname" value={kontakt.nachname} />
              <Field
                label="E-Mail"
                value={
                  kontakt.email ? (
                    <a
                      href={`mailto:${kontakt.email}`}
                      className="hover:underline"
                    >
                      {kontakt.email}
                    </a>
                  ) : null
                }
              />
              <Field
                label="Telefon"
                value={
                  kontakt.telefon ? (
                    <a
                      href={`tel:${kontakt.telefon}`}
                      className="hover:underline"
                    >
                      {kontakt.telefon}
                    </a>
                  ) : null
                }
              />
              <Field label="Adresse" value={formatAdresse(kontakt)} />
              <Field label="Ausweis-Nr." value={kontakt.ausweis_nr} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">DSGVO</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Datenweitergabe"
                value={kontakt.dsgvo_datenweitergabe ? "Ja" : "Nein"}
              />
              <Field
                label="Einwilligung am"
                value={formatDate(kontakt.dsgvo_einwilligung_am)}
              />
            </dl>
          </CardContent>
        </Card>

        {kontakt.notiz ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{kontakt.notiz}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
