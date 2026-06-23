import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoKontakt } from "@/lib/dev/demo-kontakte"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteKontaktButton } from "@/components/kontakte/delete-kontakt-button"
import { VertraegeListe } from "@/components/vertraege/vertraege-liste"
import { formatAdresse, formatDate } from "@/lib/utils/format"
import type { VertragMitRelationen } from "@/types/vertrag"
import {
  KONTAKT_TYP_LABELS,
  KONTAKT_TYP_VARIANT,
  kontaktName,
  type Kontakt,
} from "@/types/kontakt"

const VERTRAG_SELECT =
  "*, objekt:objekte(kuerzel, bezeichnung), einheit:einheiten(verwendungszweck_code, bezeichnung), mieter:kontakte(vorname, nachname, firma)"

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

  // Verträge, in denen dieser Kontakt Mieter ist (bidirektionale Verlinkung).
  const { data: vertraegeData } = await supabase
    .from("vertraege")
    .select(VERTRAG_SELECT)
    .eq("mieter_id", id)
    .order("beginn", { nullsFirst: false })
  let vertraege = (vertraegeData ?? []) as unknown as VertragMitRelationen[]
  if (isPreviewNoAuth() && vertraege.length === 0) {
    vertraege = DEMO_VERTRAEGE.filter((v) => v.mieter_id === id)
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

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Verträge als Mieter ({vertraege.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/vertraege/neu?mieter=${kontakt.id}`} />}
            >
              <Plus />
              <span>Neuer Vertrag</span>
            </Button>
          </CardHeader>
          <CardContent>
            <VertraegeListe
              vertraege={vertraege}
              kontext="mieter"
              emptyText="Dieser Kontakt ist in keinem Vertrag als Mieter hinterlegt."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
