import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoEinheit } from "@/lib/dev/demo-einheiten"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteEinheitButton } from "@/components/einheiten/delete-einheit-button"
import {
  EINHEITSTYP_LABELS,
  EINHEIT_STATUS_LABELS,
  EINHEIT_STATUS_VARIANT,
  type EinheitMitObjekt,
} from "@/types/einheit"

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
              <Badge
                variant={EINHEIT_STATUS_VARIANT[einheit.status] ?? "secondary"}
              >
                {EINHEIT_STATUS_LABELS[einheit.status] ?? einheit.status}
              </Badge>
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
                  einheit.einheitstyp
                    ? (EINHEITSTYP_LABELS[einheit.einheitstyp] ??
                      einheit.einheitstyp)
                    : null
                }
              />
              <Field
                label="Verwendungszweck-Code"
                value={einheit.verwendungszweck_code}
              />
              <Field label="Lage" value={einheit.lage} />
              <Field label="Etage" value={einheit.etage} />
              <Field
                label="Wohnfläche"
                value={
                  einheit.wohnflaeche_qm != null
                    ? `${einheit.wohnflaeche_qm} m²`
                    : null
                }
              />
              <Field label="Zimmer" value={einheit.zimmer_anzahl} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
