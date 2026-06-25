import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteBuchungButton } from "@/components/buchungen/delete-buchung-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { naechte } from "@/lib/utils/citytax"
import { kontaktName } from "@/types/kontakt"
import {
  BUCHUNG_STATUS_LABELS,
  BUCHUNG_STATUS_VARIANT,
  KANAL_LABELS,
  type BuchungMitRelationen,
} from "@/types/buchung"

const SELECT =
  "*, einheit:einheiten(verwendungszweck_code, bezeichnung, objekt_id, objekt:objekte(kuerzel)), gast:kontakte(vorname, nachname, firmenname)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "–"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "–"
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export default async function BuchungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("buchungen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const buchung = data as unknown as BuchungMitRelationen | null

  if (!buchung) {
    notFound()
  }

  const einheitLabel =
    buchung.einheit?.verwendungszweck_code ??
    buchung.einheit?.bezeichnung ??
    "Buchung"

  const titel = buchung.gast ? kontaktName(buchung.gast) : einheitLabel
  const naechteAnzahl = naechte(buchung.checkin, buchung.checkout)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/buchungen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Buchungen
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <Badge
                variant={BUCHUNG_STATUS_VARIANT[buchung.status] ?? "secondary"}
              >
                {BUCHUNG_STATUS_LABELS[buchung.status] ?? buchung.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {einheitLabel}
              {buchung.kanal
                ? ` · ${KANAL_LABELS[buchung.kanal] ?? buchung.kanal}`
                : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/buchungen/${buchung.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteBuchungButton id={buchung.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buchung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Einheit"
                value={
                  buchung.einheit_id ? (
                    <Link
                      href={`/einheiten/${buchung.einheit_id}`}
                      className="hover:underline"
                    >
                      {einheitLabel}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Objekt"
                value={
                  buchung.einheit?.objekt_id ? (
                    <Link
                      href={`/objekte/${buchung.einheit.objekt_id}`}
                      className="hover:underline"
                    >
                      {buchung.einheit.objekt?.kuerzel ?? "Objekt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Gast"
                value={
                  buchung.gast_id ? (
                    <Link
                      href={`/kontakte/${buchung.gast_id}`}
                      className="hover:underline"
                    >
                      {buchung.gast ? kontaktName(buchung.gast) : "Kontakt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Kanal"
                value={
                  buchung.kanal
                    ? (KANAL_LABELS[buchung.kanal] ?? buchung.kanal)
                    : null
                }
              />
              <Field label="Beds24-ID" value={buchung.beds24_id} />
              <Field label="Personen" value={buchung.personen} />
              <Field label="Check-in" value={formatDateTime(buchung.checkin)} />
              <Field
                label="Check-out"
                value={formatDateTime(buchung.checkout)}
              />
              <Field
                label="Nächte"
                value={naechteAnzahl > 0 ? naechteAnzahl : null}
              />
              <Field
                label="Status"
                value={
                  <Badge
                    variant={
                      BUCHUNG_STATUS_VARIANT[buchung.status] ?? "secondary"
                    }
                  >
                    {BUCHUNG_STATUS_LABELS[buchung.status] ?? buchung.status}
                  </Badge>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zugang &amp; PINs</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Apartment-PIN (dynamisch)"
                value={
                  buchung.apartment_pin ? (
                    <span className="font-mono">{buchung.apartment_pin}</span>
                  ) : null
                }
              />
              <Field
                label="Keybox-PIN (statisch)"
                value={
                  buchung.keybox_pin ? (
                    <span className="font-mono">{buchung.keybox_pin}</span>
                  ) : null
                }
              />
              <Field label="Tuya-Szene" value={buchung.tuya_szene} />
              <Field
                label="Gästemappe-Token"
                value={
                  buchung.gaestemappe_token ? (
                    <span className="font-mono text-xs break-all">
                      {buchung.gaestemappe_token}
                    </span>
                  ) : null
                }
              />
              <Field
                label="Meldeschein / Reisepass"
                value={buchung.meldeschein_reisepass}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Abrechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Betrag" value={formatEUR(buchung.betrag_brutto)} />
              <Field
                label="USt"
                value={
                  buchung.ust_prozent != null
                    ? `${buchung.ust_prozent} %`
                    : null
                }
              />
              <Field label="CityTax" value={formatEUR(buchung.citytax_betrag)} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
