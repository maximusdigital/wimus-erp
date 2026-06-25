import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoVertrag } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { loadVertragOptions } from "@/lib/vertrag-options"
import { VertragForm } from "@/components/vertraege/vertrag-form"
import {
  VERTRAGSTYP_LABELS,
  type Vertrag,
} from "@/types/vertrag"

export const metadata = {
  title: "Vertrag bearbeiten",
}

export default async function VertragBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .schema("wimus")
    .from("mietvertraege")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  let vertrag = data as Vertrag | null

  if (!vertrag && isPreviewNoAuth()) {
    vertrag = (findDemoVertrag(id) as Vertrag | undefined) ?? null
  }

  if (!vertrag) {
    notFound()
  }

  const { objekte, einheiten, kontakte } = await loadVertragOptions()

  const titel = vertrag.vertragstyp
    ? (VERTRAGSTYP_LABELS[vertrag.vertragstyp] ?? vertrag.vertragstyp)
    : "Vertrag"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/vertraege/${vertrag.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Vertrag
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Vertragsdaten aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <VertragForm
          vertrag={vertrag}
          objekte={objekte}
          einheiten={einheiten}
          kontakte={kontakte}
        />
      </div>
    </div>
  )
}
