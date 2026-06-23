import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadVertragOptions } from "@/lib/vertrag-options"
import { VertragForm } from "@/components/vertraege/vertrag-form"

export const metadata = {
  title: "Neuer Vertrag",
}

export default async function NeuerVertragPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; einheit?: string; mieter?: string }>
}) {
  const { objekt, einheit, mieter } = await searchParams
  const { objekte, einheiten, kontakte } = await loadVertragOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/vertraege"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Verträge
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neuer Vertrag
        </h1>
        <p className="text-muted-foreground text-sm">
          Mietvertrag erfassen und mit Einheit und Mieter verknüpfen.
        </p>
      </div>

      <div className="max-w-4xl">
        <VertragForm
          objekte={objekte}
          einheiten={einheiten}
          kontakte={kontakte}
          defaultObjektId={objekt}
          defaultEinheitId={einheit}
          defaultMieterId={mieter}
        />
      </div>
    </div>
  )
}
