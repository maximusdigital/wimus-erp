import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoObjekt } from "@/lib/dev/demo-objekte"
import { DEMO_EINHEITEN } from "@/lib/dev/demo-einheiten"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { AddressBlock } from "@/components/ui/address-block"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteObjektButton } from "@/components/objekte/delete-objekt-button"
import { EinheitenListe } from "@/components/einheiten/einheiten-liste"
import { VertraegeListe } from "@/components/vertraege/vertraege-liste"
import { VorgaengeListe } from "@/components/vorgaenge/vorgaenge-liste"
import { formatAdresse, formatDate, formatEUR } from "@/lib/utils/format"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import type { Einheit } from "@/types/einheit"
import type { VertragMitRelationen } from "@/types/vertrag"
import type { VorgangMitRelationen } from "@/types/vorgang"
import {
  HALTESTRATEGIE_LABELS,
  OBJEKTTYP_LABELS,
  OBJEKT_STATUS_LABELS,
  OBJEKT_STATUS_VARIANT,
  type Objekt,
} from "@/types/objekt"

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

export default async function ObjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const [objektRes, einheitenRes, vertraegeRes, vorgaengeRes] =
    await Promise.all([
    supabase.from("objekte").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("einheiten")
      .select("*")
      .eq("objekt_id", id)
      .order("verwendungszweck_code", { nullsFirst: false }),
    supabase
      .from("vertraege")
      .select(VERTRAG_SELECT)
      .eq("objekt_id", id)
      .order("beginn", { nullsFirst: false }),
    supabase
      .from("vorgaenge")
      .select(VORGANG_SELECT)
      .eq("objekt_id", id)
      .order("faellig_am", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ])

  let objekt = objektRes.data as Objekt | null
  let einheiten = (einheitenRes.data ?? []) as Einheit[]
  let vertraege = (vertraegeRes.data ?? []) as unknown as VertragMitRelationen[]
  const vorgaenge = (vorgaengeRes.data ?? []) as unknown as VorgangMitRelationen[]

  if (!objekt && isPreviewNoAuth()) {
    objekt = findDemoObjekt(id) ?? null
  }
  if (isPreviewNoAuth() && einheiten.length === 0) {
    einheiten = DEMO_EINHEITEN.filter((e) => e.objekt_id === id) as Einheit[]
  }
  if (isPreviewNoAuth() && vertraege.length === 0) {
    vertraege = DEMO_VERTRAEGE.filter((v) => v.objekt_id === id)
  }

  if (!objekt) {
    notFound()
  }

  const einheitenCount = einheiten.length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/objekte"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Objekte
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {objekt.kuerzel}
              </h1>
              <Badge variant={OBJEKT_STATUS_VARIANT[objekt.status] ?? "secondary"}>
                {OBJEKT_STATUS_LABELS[objekt.status] ?? objekt.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {objekt.bezeichnung ?? formatAdresse(objekt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/objekte/${objekt.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteObjektButton id={objekt.id} kuerzel={objekt.kuerzel} />
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
                label="Objekttyp"
                value={
                  objekt.objekttyp
                    ? (OBJEKTTYP_LABELS[objekt.objekttyp] ?? objekt.objekttyp)
                    : null
                }
              />
              <Field
                label="Haltestrategie"
                value={
                  objekt.haltestrategie
                    ? (HALTESTRATEGIE_LABELS[objekt.haltestrategie] ??
                      objekt.haltestrategie)
                    : null
                }
              />
              <Field label="Baujahr" value={objekt.baujahr} />
              <Field
                label="Wohnfläche"
                value={
                  objekt.wohnflaeche_qm ? `${objekt.wohnflaeche_qm} m²` : null
                }
              />
              <Field label="Einheiten" value={einheitenCount} />
              <div className="col-span-2 space-y-0.5">
                <dt className="text-muted-foreground text-xs">Adresse</dt>
                <dd>
                  <AddressBlock
                    adresse={{
                      strasse: objekt.strasse,
                      hausnummer: objekt.hausnummer,
                      plz: objekt.plz,
                      stadt: objekt.ort,
                    }}
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bewertung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Marktwert Sprengnetter"
                value={
                  objekt.marktwert_sprengnetter != null
                    ? formatEUR(objekt.marktwert_sprengnetter)
                    : null
                }
              />
              <Field
                label="Marktwert PriceHubble"
                value={
                  objekt.marktwert_pricehubble != null
                    ? formatEUR(objekt.marktwert_pricehubble)
                    : null
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Steuer &amp; Fristen</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Nutzen-Lasten-Wechsel"
                value={formatDate(objekt.nutzen_lasten_datum)}
              />
              <Field
                label="Notartermin"
                value={formatDate(objekt.notartermin_datum)}
              />
            </dl>
          </CardContent>
        </Card>

        {objekt.notiz ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{objekt.notiz}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Einheiten ({einheitenCount})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/einheiten/neu?objekt=${objekt.id}`} />}
            >
              <Plus />
              <span>Neue Einheit</span>
            </Button>
          </CardHeader>
          <CardContent>
            <EinheitenListe
              einheiten={einheiten}
              emptyText="Noch keine Einheiten – lege die erste Einheit für dieses Objekt an."
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Verträge ({vertraege.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/vertraege/neu?objekt=${objekt.id}`} />}
            >
              <Plus />
              <span>Neuer Vertrag</span>
            </Button>
          </CardHeader>
          <CardContent>
            <VertraegeListe
              vertraege={vertraege}
              kontext="objekt"
              emptyText="Noch keine Verträge für dieses Objekt."
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
              render={<Link href={`/vorgaenge/neu?objekt=${objekt.id}`} />}
            >
              <Plus />
              <span>Neuer Vorgang</span>
            </Button>
          </CardHeader>
          <CardContent>
            <VorgaengeListe
              vorgaenge={vorgaenge}
              kontext="objekt"
              emptyText="Noch keine Vorgänge für dieses Objekt."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
