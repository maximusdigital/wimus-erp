import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadForderungOptions } from "@/lib/forderung-options"
import { ForderungForm } from "@/components/forderungen/forderung-form"
import { kontaktName } from "@/types/kontakt"
import type { ForderungMitRelationen } from "@/types/forderung"

export const metadata = {
  title: "Forderung bearbeiten",
}

const SELECT =
  "*, kontakt:kontakte!kontakt_id(vorname, nachname, firmenname), mietvertrag:mietvertraege(aktenzeichen)"

export default async function ForderungBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("forderungen")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle()

  const forderung = data as unknown as ForderungMitRelationen | null

  if (!forderung) {
    notFound()
  }

  const { kontakte, vertraege } = await loadForderungOptions()
  const titel = forderung.kontakt
    ? kontaktName(forderung.kontakt)
    : "Forderung"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/finanzen/forderungen/${forderung.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Forderung
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Forderungsdaten aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <ForderungForm
          forderung={forderung}
          kontakte={kontakte}
          vertraege={vertraege}
        />
      </div>
    </div>
  )
}
