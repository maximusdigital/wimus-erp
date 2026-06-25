import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import {
  loadAbrechnungseinheitOptions,
  loadBkArtOptions,
  loadObjektOptions,
} from "@/lib/betriebskosten-options"
import { PositionForm } from "@/components/betriebskosten/position-form"
import { DeletePositionButton } from "@/components/betriebskosten/delete-position-button"
import type { KostenpositionMitRelationen } from "@/types/betriebskosten"

export const metadata = {
  title: "Kostenposition bearbeiten",
}

const SELECT =
  "*, bk_art:bk_arten(bezeichnung, kategorie, standard_schluessel)"

export default async function KostenpositionBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("kostenverteilung_positionen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const position = data as unknown as KostenpositionMitRelationen | null

  if (!position) {
    notFound()
  }

  const [objekte, bkArten, abrechnungseinheiten] = await Promise.all([
    loadObjektOptions(),
    loadBkArtOptions(),
    loadAbrechnungseinheitOptions(),
  ])

  const titel = position.bk_art?.bezeichnung ?? "Kostenposition"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/betriebskosten/positionen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kostenpositionen
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {titel} bearbeiten
            </h1>
            <p className="text-muted-foreground text-sm">
              Kostenposition aktualisieren.
            </p>
          </div>
          <DeletePositionButton id={position.id} label={titel} />
        </div>
      </div>

      <div className="max-w-4xl">
        <PositionForm
          position={position}
          objekte={objekte}
          bkArten={bkArten}
          abrechnungseinheiten={abrechnungseinheiten}
        />
      </div>
    </div>
  )
}
