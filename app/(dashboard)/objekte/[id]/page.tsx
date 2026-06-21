import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoObjekt } from "@/lib/dev/demo-objekte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteObjektButton } from "@/components/objekte/delete-objekt-button"
import { formatAdresse, formatDate, formatEUR } from "@/lib/utils/format"
import {
  HALTESTRATEGIE_LABELS,
  OBJEKTTYP_LABELS,
  OBJEKT_STATUS_LABELS,
  OBJEKT_STATUS_VARIANT,
  type ObjektMitEinheiten,
} from "@/types/objekt"

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
  const { data } = await supabase
    .from("objekte")
    .select("*, einheiten(count)")
    .eq("id", id)
    .maybeSingle()

  let objekt = data as ObjektMitEinheiten | null

  if (!objekt && isPreviewNoAuth()) {
    objekt = findDemoObjekt(id) ?? null
  }

  if (!objekt) {
    notFound()
  }

  const einheiten = objekt.einheiten?.[0]?.count ?? 0

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
              <Field label="Einheiten" value={einheiten} />
              <Field
                label="Adresse"
                value={formatAdresse(objekt)}
              />
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
      </div>
    </div>
  )
}
