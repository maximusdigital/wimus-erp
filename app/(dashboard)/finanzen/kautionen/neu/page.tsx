import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadFinanzenOptions } from "@/lib/finanzen-options"
import { KautionForm } from "@/components/kautionen/kaution-form"

export const metadata = {
  title: "Neue Kaution",
}

export default async function NeueKautionPage({
  searchParams,
}: {
  searchParams: Promise<{ vertrag?: string }>
}) {
  const { vertrag } = await searchParams
  const { vertraege, kontakte } = await loadFinanzenOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/finanzen/kautionen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kautionen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Kaution
        </h1>
        <p className="text-muted-foreground text-sm">
          Kaution erfassen und mit Vertrag und Mieter verknüpfen.
        </p>
      </div>

      <div className="max-w-4xl">
        <KautionForm
          vertraege={vertraege}
          kontakte={kontakte}
          defaultVertragId={vertrag}
        />
      </div>
    </div>
  )
}
