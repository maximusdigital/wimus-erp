import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadForderungOptions } from "@/lib/forderung-options"
import { ForderungForm } from "@/components/forderungen/forderung-form"

export const metadata = {
  title: "Neue Forderung",
}

export default async function NeueForderungPage({
  searchParams,
}: {
  searchParams: Promise<{ kontakt?: string; vertrag?: string }>
}) {
  const { kontakt, vertrag } = await searchParams
  const { kontakte, vertraege } = await loadForderungOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/finanzen/forderungen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Forderungen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Forderung
        </h1>
        <p className="text-muted-foreground text-sm">
          Forderung erfassen und mit Kontakt und Vertrag verknüpfen.
        </p>
      </div>

      <div className="max-w-4xl">
        <ForderungForm
          kontakte={kontakte}
          vertraege={vertraege}
          defaultKontaktId={kontakt}
          defaultVertragId={vertrag}
        />
      </div>
    </div>
  )
}
