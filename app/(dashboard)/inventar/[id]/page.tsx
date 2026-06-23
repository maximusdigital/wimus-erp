import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Pencil } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteAssetButton } from "@/components/assets/delete-asset-button"
import { formatDate, formatEUR } from "@/lib/utils/format"
import {
  einheitLabel,
  ASSET_STANDORT_TYP_LABELS,
  ASSET_TYP_LABELS,
  ASSET_ZUSTAND_LABELS,
  ASSET_ZUSTAND_VARIANT,
  type AssetMitRelationen,
} from "@/types/asset"

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

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("asset_register")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const asset = data as unknown as AssetMitRelationen | null

  if (!asset) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/inventar"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Inventar
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {asset.bezeichnung}
              </h1>
              {asset.zustand ? (
                <Badge
                  variant={ASSET_ZUSTAND_VARIANT[asset.zustand] ?? "secondary"}
                >
                  {ASSET_ZUSTAND_LABELS[asset.zustand] ?? asset.zustand}
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {asset.typ
                ? (ASSET_TYP_LABELS[asset.typ] ?? asset.typ)
                : "Asset"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/inventar/${asset.id}/bearbeiten`} />}
            >
              <Pencil />
              <span>Bearbeiten</span>
            </Button>
            <DeleteAssetButton id={asset.id} label={asset.bezeichnung} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Asset-Code prominent – QR-Etikett folgt. */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Asset-Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-2xl font-semibold tracking-wider">
              {asset.asset_code ?? "—"}
            </span>
            <span className="text-muted-foreground text-xs">
              QR-Etikett folgt
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Typ"
                value={
                  asset.typ
                    ? (ASSET_TYP_LABELS[asset.typ] ?? asset.typ)
                    : null
                }
              />
              <Field label="Asset-Code" value={asset.asset_code} />
              <Field
                label="Zustand"
                value={
                  asset.zustand ? (
                    <Badge
                      variant={
                        ASSET_ZUSTAND_VARIANT[asset.zustand] ?? "secondary"
                      }
                    >
                      {ASSET_ZUSTAND_LABELS[asset.zustand] ?? asset.zustand}
                    </Badge>
                  ) : null
                }
              />
              <Field
                label="Standort"
                value={
                  asset.standort_typ
                    ? (ASSET_STANDORT_TYP_LABELS[asset.standort_typ] ??
                      asset.standort_typ)
                    : null
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anschaffung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Anschaffung am"
                value={formatDate(asset.anschaffung_am)}
              />
              <Field
                label="Anschaffungswert"
                value={formatEUR(asset.anschaffung_wert)}
              />
              <Field label="Erstellt" value={formatDate(asset.created_at)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Bezug</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field
                label="Objekt"
                value={
                  asset.objekt_id ? (
                    <Link
                      href={`/objekte/${asset.objekt_id}`}
                      className="hover:underline"
                    >
                      {asset.objekt?.kuerzel ?? "Objekt"}
                    </Link>
                  ) : null
                }
              />
              <Field
                label="Einheit"
                value={
                  asset.einheit_id ? (
                    <Link
                      href={`/einheiten/${asset.einheit_id}`}
                      className="hover:underline"
                    >
                      {einheitLabel(asset.einheit) ?? "Einheit"}
                    </Link>
                  ) : null
                }
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
