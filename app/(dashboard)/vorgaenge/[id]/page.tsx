import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriorityBadge } from "@/components/ui/priority-badge"
import { DeleteVorgangButton } from "@/components/vorgaenge/delete-vorgang-button"
import {
  VorgangZuweisungen,
  type ZuweisungRow,
} from "@/components/vorgaenge/vorgang-zuweisungen"
import { VorgangTypPanel } from "@/components/vorgaenge/vorgang-typ-panel"
import { VorgangFotos, type FotoRow } from "@/components/vorgaenge/vorgang-fotos"
import { VorgangEskalation } from "@/components/vorgaenge/vorgang-eskalation"
import { TYP_TABELLE } from "@/lib/validations/vorgang-typ"
import { eskalationsGrund, eskalationFaellig } from "@/lib/ops/eskalation"
import { formatDate, formatEUR } from "@/lib/utils/format"
import {
  einheitLabel,
  kontaktLabel,
  vorgangTitel,
  MASSNAHME_TYP_LABELS,
  VORGANG_KOSTENTRAEGER_LABELS,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_STATUS_LABELS,
  VORGANG_STATUS_VARIANT,
  VORGANG_TYP_LABELS,
  type VorgangMitRelationen,
} from "@/types/vorgang"

const SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung), handwerker:kontakte!handwerker_id(vorname, nachname, firmenname), gemeldet:kontakte!gemeldet_von(vorname, nachname, firmenname)"

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
    .schema("wimus")
    .from("vorgaenge")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const vorgang = data as unknown as VorgangMitRelationen | null

  if (!vorgang) {
    notFound()
  }

  // Engine-Begleiter: Verlauf, Zuweisungen + Auswahllisten.
  const [{ data: verlaufRaw }, { data: zuwRaw }, { data: akteureRaw }, { data: orgsRaw }, { data: fotosRaw }] =
    await Promise.all([
      supabase
        .schema("wimus")
        .from("vorgang_verlauf")
        .select("id, art, von_status, nach_status, notiz, am")
        .eq("vorgang_id", id)
        .order("am", { ascending: false }),
      supabase
        .schema("wimus")
        .from("vorgang_zuweisung")
        .select("id, rolle, status, akteur_id, organisation_id, kontakt_id, akteur:akteure(name), organisation:organisationen(name)")
        .eq("vorgang_id", id)
        .order("created_at", { ascending: true }),
      supabase.schema("wimus").from("akteure").select("id, name").eq("aktiv", true).order("name"),
      supabase.schema("wimus").from("organisationen").select("id, name").order("name").limit(500),
      supabase
        .schema("wimus")
        .from("vorgang_foto")
        .select("id, phase, url, beschreibung, aufgenommen_am")
        .eq("vorgang_id", id)
        .order("aufgenommen_am", { ascending: true }),
    ])

  const verlauf = (verlaufRaw ?? []) as {
    id: string
    art: string
    von_status: string | null
    nach_status: string | null
    notiz: string | null
    am: string
  }[]
  const zuweisungen = (zuwRaw ?? []) as unknown as ZuweisungRow[]
  const akteure = (akteureRaw ?? []) as { id: string; name: string }[]
  const organisationen = (orgsRaw ?? []) as { id: string; name: string }[]
  const fotos = (fotosRaw ?? []) as FotoRow[]

  // Typ-Zusatzdaten (1:1), falls der Vorgangstyp eine Erweiterung hat.
  const typTabelle = vorgang.typ ? TYP_TABELLE[vorgang.typ] : undefined
  let typDaten: Record<string, unknown> | null = null
  if (typTabelle) {
    const { data: td } = await supabase
      .schema("wimus")
      .from(typTabelle)
      .select("*")
      .eq("vorgang_id", id)
      .maybeSingle()
    typDaten = (td as Record<string, unknown> | null) ?? null
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
                {vorgangTitel(vorgang)}
              </h1>
              <Badge
                variant={
                  VORGANG_STATUS_VARIANT[vorgang.status] ?? "secondary"
                }
              >
                {VORGANG_STATUS_LABELS[vorgang.status] ?? vorgang.status}
              </Badge>
              <PriorityBadge prioritaet={vorgang.prioritaet}>
                {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ??
                  vorgang.prioritaet}
              </PriorityBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {vorgang.typ
                ? (VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ)
                : "Vorgang"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VorgangEskalation
              vorgangId={vorgang.id}
              manuell={vorgang.eskaliert === true}
              computed={eskalationFaellig(vorgang)}
              grund={eskalationsGrund(vorgang)}
            />
            <Button
              variant="outline"
              render={<Link href={`/vorgaenge/${vorgang.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteVorgangButton id={vorgang.id} label={vorgangTitel(vorgang)} />
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
                label="Aktenzeichen"
                value={vorgang.aktenzeichen}
              />
              <Field
                label="Typ"
                value={
                  vorgang.typ
                    ? (VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ)
                    : null
                }
              />
              <Field
                label="Maßnahme"
                value={
                  vorgang.massnahme_typ
                    ? (MASSNAHME_TYP_LABELS[vorgang.massnahme_typ] ??
                      vorgang.massnahme_typ)
                    : null
                }
              />
              <Field
                label="Priorität"
                value={
                  <PriorityBadge prioritaet={vorgang.prioritaet}>
                    {VORGANG_PRIORITAET_LABELS[vorgang.prioritaet] ??
                      vorgang.prioritaet}
                  </PriorityBadge>
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
              <Field
                label="Kostenträger"
                value={
                  vorgang.kostentraeger
                    ? (VORGANG_KOSTENTRAEGER_LABELS[vorgang.kostentraeger] ??
                      vorgang.kostentraeger)
                    : null
                }
              />
              <Field
                label="Kosten (geschätzt)"
                value={
                  vorgang.kosten_geschaetzt !== null
                    ? formatEUR(vorgang.kosten_geschaetzt)
                    : null
                }
              />
              <Field
                label="Kosten (Ist)"
                value={
                  vorgang.kosten_ist !== null
                    ? formatEUR(vorgang.kosten_ist)
                    : null
                }
              />
              <Field
                label="Leistungsdatum"
                value={formatDate(vorgang.leistungsdatum)}
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
              <Field
                label="Handwerker"
                value={
                  vorgang.handwerker_id ? (
                    <Link
                      href={`/kontakte/${vorgang.handwerker_id}`}
                      className="hover:underline"
                    >
                      {kontaktLabel(vorgang.handwerker) ?? "Kontakt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Gemeldet von"
                value={
                  vorgang.gemeldet_von ? (
                    <Link
                      href={`/kontakte/${vorgang.gemeldet_von}`}
                      className="hover:underline"
                    >
                      {kontaktLabel(vorgang.gemeldet) ?? "Kontakt"}
                    </Link>
                  ) : null
                }
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {typTabelle && vorgang.typ ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {VORGANG_TYP_LABELS[vorgang.typ] ?? vorgang.typ} — Zusatzdaten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VorgangTypPanel vorgangId={vorgang.id} typ={vorgang.typ} initial={typDaten} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fotos (Vorher / Nachher)</CardTitle>
        </CardHeader>
        <CardContent>
          <VorgangFotos vorgangId={vorgang.id} fotos={fotos} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zuweisungen</CardTitle>
          </CardHeader>
          <CardContent>
            <VorgangZuweisungen
              vorgangId={vorgang.id}
              zuweisungen={zuweisungen}
              akteure={akteure}
              organisationen={organisationen}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            {verlauf.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {verlauf.map((v) => (
                  <li key={v.id} className="flex items-start gap-2">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">
                      {formatDate(v.am)}
                    </span>
                    <span>
                      {v.art === "status" ? (
                        <>
                          Status:{" "}
                          {v.von_status
                            ? (VORGANG_STATUS_LABELS[v.von_status] ?? v.von_status)
                            : "–"}{" "}
                          →{" "}
                          {v.nach_status
                            ? (VORGANG_STATUS_LABELS[v.nach_status] ?? v.nach_status)
                            : "–"}
                        </>
                      ) : (
                        (v.notiz ?? v.art)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
