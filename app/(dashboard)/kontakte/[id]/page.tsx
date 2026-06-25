import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoKontakt } from "@/lib/dev/demo-kontakte"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { AddressBlock } from "@/components/ui/address-block"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteKontaktButton } from "@/components/kontakte/delete-kontakt-button"
import { VertraegeListe } from "@/components/vertraege/vertraege-liste"
import { formatAdresse } from "@/lib/utils/format"
import type { VertragMitRelationen } from "@/types/vertrag"
import {
  kontaktName,
  kontaktRollen,
  SPRACHE_LABELS,
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
    .schema("wimus")
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
  const rollen = kontaktRollen(kontakt)
  const adresse = formatAdresse({
    strasse: kontakt.strasse,
    hausnummer: kontakt.hausnummer,
    plz: kontakt.plz,
    ort: kontakt.stadt,
  })

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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{name}</h1>
              {rollen.map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))}
              {kontakt.aktiv === false ? (
                <Badge variant="outline">Inaktiv</Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {kontakt.email ?? adresse}
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
              {kontakt.kontakt_typ === "firma" ? (
                <>
                  <Field label="Firmenname" value={kontakt.firmenname} />
                  <Field label="Rechtsform" value={kontakt.rechtsform} />
                </>
              ) : (
                <>
                  <Field label="Anrede" value={kontakt.anrede} />
                  <Field label="Vorname" value={kontakt.vorname} />
                  <Field label="Nachname" value={kontakt.nachname} />
                </>
              )}
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
                label="Telefon (mobil)"
                value={
                  kontakt.telefon_mobil ? (
                    <a
                      href={`tel:${kontakt.telefon_mobil}`}
                      className="hover:underline"
                    >
                      {kontakt.telefon_mobil}
                    </a>
                  ) : null
                }
              />
              <Field
                label="Telefon (Festnetz)"
                value={
                  kontakt.telefon_festnetz ? (
                    <a
                      href={`tel:${kontakt.telefon_festnetz}`}
                      className="hover:underline"
                    >
                      {kontakt.telefon_festnetz}
                    </a>
                  ) : null
                }
              />
              <div className="col-span-2 space-y-0.5">
                <dt className="text-muted-foreground text-xs">Adresse</dt>
                <dd>
                  <AddressBlock
                    adresse={{
                      strasse: kontakt.strasse,
                      hausnummer: kontakt.hausnummer,
                      plz: kontakt.plz,
                      stadt: kontakt.stadt,
                      land: kontakt.land,
                    }}
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank &amp; Buchhaltung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="IBAN" value={kontakt.iban} />
              <Field label="BIC" value={kontakt.bic} />
              <Field label="Debitor-Nr." value={kontakt.debitor_nr} />
              <Field label="Kreditor-Nr." value={kontakt.kreditor_nr} />
              <Field
                label="Zahlungsziel"
                value={
                  kontakt.zahlungsziel_tage != null
                    ? `${kontakt.zahlungsziel_tage} Tage`
                    : null
                }
              />
              <Field
                label="Sprache"
                value={
                  kontakt.sprache
                    ? (SPRACHE_LABELS[kontakt.sprache] ?? kontakt.sprache)
                    : null
                }
              />
              <Field
                label="DSGVO-Datenweitergabe"
                value={kontakt.dsgvo_datenweitergabe ? "Ja" : "Nein"}
              />
            </dl>
          </CardContent>
        </Card>

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
