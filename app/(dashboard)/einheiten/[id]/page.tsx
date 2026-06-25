import Link from "next/link"
import { notFound } from "next/navigation"
import { Building2, ChevronLeft, Pencil, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoEinheit, DEMO_EINHEITEN } from "@/lib/dev/demo-einheiten"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteEinheitButton } from "@/components/einheiten/delete-einheit-button"
import { EinheitenListe } from "@/components/einheiten/einheiten-liste"
import { VertraegeListe } from "@/components/vertraege/vertraege-liste"
import { VorgaengeListe } from "@/components/vorgaenge/vorgaenge-liste"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import type { VertragMitRelationen } from "@/types/vertrag"
import type { VorgangMitRelationen } from "@/types/vorgang"
import {
  EINHEITSTYP_LABELS,
  type Einheit,
  type EinheitMitObjekt,
} from "@/types/einheit"

const VERTRAG_SELECT =
  "*, objekt:objekte(kuerzel, bezeichnung), einheit:einheiten(verwendungszweck_code, bezeichnung), mieter:kontakte(vorname, nachname, firma)"
const VORGANG_SELECT =
  "*, objekt:objekte(kuerzel), einheit:einheiten(verwendungszweck_code, bezeichnung)"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "–"}</dd>
    </div>
  )
}

export default async function EinheitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("einheiten")
    .select("*, objekte(kuerzel, bezeichnung)")
    .eq("id", id)
    .maybeSingle()

  let einheit = data as EinheitMitObjekt | null

  if (!einheit && isPreviewNoAuth()) {
    einheit = findDemoEinheit(id) ?? null
  }

  if (!einheit) {
    notFound()
  }

  // Geschwister-Einheiten desselben Objekts (bidirektionale Navigation).
  let geschwister: Einheit[] = []
  if (einheit.objekt_id) {
    const { data: geschwisterData } = await supabase
      .schema("wimus")
      .from("einheiten")
      .select("*")
      .eq("objekt_id", einheit.objekt_id)
      .order("verwendungszweck_code", { nullsFirst: false })
    geschwister = (geschwisterData ?? []) as Einheit[]
    if (isPreviewNoAuth() && geschwister.length === 0) {
      geschwister = DEMO_EINHEITEN.filter(
        (e) => e.objekt_id === einheit!.objekt_id
      ) as Einheit[]
    }
  }

  // Verträge dieser Einheit (bidirektionale Verlinkung).
  const { data: vertraegeData } = await supabase
    .from("vertraege")
    .select(VERTRAG_SELECT)
    .eq("einheit_id", id)
    .order("beginn", { nullsFirst: false })
  let vertraege = (vertraegeData ?? []) as unknown as VertragMitRelationen[]
  if (isPreviewNoAuth() && vertraege.length === 0) {
    vertraege = DEMO_VERTRAEGE.filter((v) => v.einheit_id === id)
  }

  // Vorgänge dieser Einheit (bidirektionale Verlinkung).
  const { data: vorgaengeData } = await supabase
    .from("vorgaenge")
    .select(VORGANG_SELECT)
    .eq("einheit_id", id)
    .order("faellig_am", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
  const vorgaenge = (vorgaengeData ?? []) as unknown as VorgangMitRelationen[]

  const titel =
    einheit.verwendungszweck_code ?? einheit.bezeichnung ?? "Einheit"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einheiten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Einheiten
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{titel}</h1>
              <StatusBadge status={einheit.aktiv ? "aktiv" : "inaktiv"}>
                {einheit.aktiv ? "Aktiv" : "Inaktiv"}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground text-sm">
              {einheit.bezeichnung ?? "–"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/einheiten/${einheit.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteEinheitButton id={einheit.id} label={titel} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stammdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Objekt"
                value={
                  einheit.objekt_id ? (
                    <Link
                      href={`/objekte/${einheit.objekt_id}`}
                      className="hover:underline"
                    >
                      {einheit.objekte?.kuerzel ?? "Objekt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Einheitstyp"
                value={
                  einheit.typ
                    ? (EINHEITSTYP_LABELS[einheit.typ] ?? einheit.typ)
                    : null
                }
              />
              <Field
                label="Verwendungszweck-Code"
                value={einheit.verwendungszweck_code}
              />
              <Field label="Lage" value={einheit.lage} />
              <Field label="Etage" value={einheit.etage_beschreibung} />
              <Field
                label="Wohnfläche"
                value={
                  einheit.flaeche != null ? `${einheit.flaeche} m²` : null
                }
              />
              <Field label="Zimmer" value={einheit.zimmer} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {einheit.objekte?.kuerzel
                ? `Weitere Einheiten in ${einheit.objekte.kuerzel}`
                : "Weitere Einheiten"}
            </CardTitle>
            {einheit.objekt_id ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/einheiten/neu?objekt=${einheit.objekt_id}`} />}
              >
                <Plus />
                <span>Neue Einheit</span>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {einheit.objekt_id ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit"
                render={<Link href={`/objekte/${einheit.objekt_id}`} />}
              >
                <Building2 />
                <span>
                  Zum Objekt{" "}
                  {einheit.objekte?.kuerzel ? `${einheit.objekte.kuerzel}` : ""}
                </span>
              </Button>
            ) : null}
            <EinheitenListe
              einheiten={geschwister}
              currentId={einheit.id}
              emptyText="Keine weiteren Einheiten in diesem Objekt."
            />
          </CardContent>
        </Card>

        {einheit.keybox_pin_statisch ||
        einheit.keybox_standort ||
        einheit.max_personen != null ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keybox &amp; KZV</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field
                  label="Keybox-PIN (statisch)"
                  value={einheit.keybox_pin_statisch}
                />
                <Field label="Keybox-Standort" value={einheit.keybox_standort} />
                <Field label="Max. Personen" value={einheit.max_personen} />
              </dl>
            </CardContent>
          </Card>
        ) : null}

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Verträge ({vertraege.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/vertraege/neu?einheit=${einheit.id}`} />}
            >
              <Plus />
              <span>Neuer Vertrag</span>
            </Button>
          </CardHeader>
          <CardContent>
            <VertraegeListe
              vertraege={vertraege}
              kontext="einheit"
              emptyText="Noch keine Verträge für diese Einheit."
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Vorgänge ({vorgaenge.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/vorgaenge/neu?einheit=${einheit.id}`} />}
            >
              <Plus />
              <span>Neuer Vorgang</span>
            </Button>
          </CardHeader>
          <CardContent>
            <VorgaengeListe
              vorgaenge={vorgaenge}
              kontext="einheit"
              emptyText="Noch keine Vorgänge für diese Einheit."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
