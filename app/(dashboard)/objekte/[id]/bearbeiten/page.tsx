import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoObjekt } from "@/lib/dev/demo-objekte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { loadEinheitZuordnungen } from "@/lib/einheit-zuordnung"
import { ObjektForm } from "@/components/objekte/objekt-form"
import type { Objekt } from "@/types/objekt"

export const metadata = {
  title: "Objekt bearbeiten",
}

export default async function ObjektBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("objekte")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  let objekt = data as Objekt | null

  if (!objekt && isPreviewNoAuth()) {
    objekt = (findDemoObjekt(id) as Objekt | undefined) ?? null
  }

  if (!objekt) {
    notFound()
  }

  const einheiten = await loadEinheitZuordnungen()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/objekte/${objekt.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Objekt
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {objekt.kuerzel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Stammdaten des Objekts aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <ObjektForm objekt={objekt} einheiten={einheiten} />
      </div>
    </div>
  )
}
