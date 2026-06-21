import Link from "next/link"
import { DoorOpen, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { DEMO_EINHEITEN } from "@/lib/dev/demo-einheiten"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Button } from "@/components/ui/button"
import { EinheitKarte } from "@/components/einheiten/einheit-karte"
import { EinheitTabelle } from "@/components/einheiten/einheit-tabelle"
import type { EinheitMitObjekt } from "@/types/einheit"

export const metadata = {
  title: "Einheiten",
}

export default async function EinheitenPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string }>
}) {
  const { objekt } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from("einheiten")
    .select("*, objekte(kuerzel, bezeichnung)")
    .order("verwendungszweck_code", { nullsFirst: false })

  if (objekt) {
    query = query.eq("objekt_id", objekt)
  }

  const { data, error } = await query

  let einheiten = (data ?? []) as EinheitMitObjekt[]

  // Vorschau/Demo: Demo-Daten, damit die Liste ohne DB befüllt ist.
  if (isPreviewNoAuth() && einheiten.length === 0) {
    einheiten = objekt
      ? DEMO_EINHEITEN.filter((e) => e.objekt_id === objekt)
      : DEMO_EINHEITEN
  }

  const neuHref = objekt ? `/einheiten/neu?objekt=${objekt}` : "/einheiten/neu"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Einheiten</h1>
          <p className="text-muted-foreground text-sm">
            {einheiten.length} {einheiten.length === 1 ? "Einheit" : "Einheiten"}
          </p>
        </div>
        <Button render={<Link href={neuHref} />}>
          <Plus />
          <span>Neue Einheit</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : einheiten.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <DoorOpen className="size-6" />
          </div>
          <div>
            <p className="font-medium">Noch keine Einheiten</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste Einheit an, um Wohnungen, Zimmer oder Gewerbe zu
              erfassen.
            </p>
          </div>
          <Button render={<Link href={neuHref} />} variant="outline">
            <Plus />
            <span>Einheit anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <EinheitTabelle einheiten={einheiten} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {einheiten.map((e) => (
              <EinheitKarte key={e.id} einheit={e} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
