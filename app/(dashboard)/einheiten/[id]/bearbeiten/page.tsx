import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoEinheit } from "@/lib/dev/demo-einheiten"
import { DEMO_OBJEKTE } from "@/lib/dev/demo-objekte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { EinheitForm } from "@/components/einheiten/einheit-form"
import type { Einheit, ObjektOption } from "@/types/einheit"

export const metadata = {
  title: "Einheit bearbeiten",
}

export default async function EinheitBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: einheitData }, { data: objekteData }] = await Promise.all([
    supabase.from("einheiten").select("*").eq("id", id).maybeSingle(),
    supabase.from("objekte").select("id, kuerzel, bezeichnung").order("kuerzel"),
  ])

  let einheit = einheitData as Einheit | null
  let objekte = (objekteData ?? []) as ObjektOption[]

  if (isPreviewNoAuth()) {
    if (!einheit) {
      einheit = (findDemoEinheit(id) as Einheit | undefined) ?? null
    }
    if (objekte.length === 0) {
      objekte = DEMO_OBJEKTE.map((o) => ({
        id: o.id,
        kuerzel: o.kuerzel,
        bezeichnung: o.bezeichnung,
      }))
    }
  }

  if (!einheit) {
    notFound()
  }

  const titel = einheit.verwendungszweck_code ?? einheit.bezeichnung ?? "Einheit"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/einheiten/${einheit.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Einheit
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Stammdaten der Einheit aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <EinheitForm einheit={einheit} objekte={objekte} />
      </div>
    </div>
  )
}
