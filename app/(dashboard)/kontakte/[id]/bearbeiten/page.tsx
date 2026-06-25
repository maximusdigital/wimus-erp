import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { findDemoKontakt } from "@/lib/dev/demo-kontakte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import {
  buildVertragOptionen,
  loadVertragZuordnungen,
} from "@/lib/vertrag-zuordnung"
import { KontaktForm } from "@/components/kontakte/kontakt-form"
import { kontaktName, type Kontakt } from "@/types/kontakt"

export const metadata = {
  title: "Kontakt bearbeiten",
}

export default async function KontaktBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("kontakte")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  let kontakt = data as Kontakt | null

  if (!kontakt && isPreviewNoAuth()) {
    kontakt = findDemoKontakt(id) ?? null
  }

  if (!kontakt) {
    notFound()
  }

  const { options: vertraege, selectedIds: selectedVertragIds } =
    buildVertragOptionen(await loadVertragZuordnungen(), "mieter_id", kontakt.id)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/kontakte/${kontakt.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Kontakt
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {kontaktName(kontakt)} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Kontaktdaten aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <KontaktForm
          kontakt={kontakt}
          vertraege={vertraege}
          selectedVertragIds={selectedVertragIds}
        />
      </div>
    </div>
  )
}
