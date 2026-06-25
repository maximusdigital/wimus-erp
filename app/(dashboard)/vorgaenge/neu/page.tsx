import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadVorgangOptions } from "@/lib/vorgang-options"
import { VorgangForm } from "@/components/vorgaenge/vorgang-form"

export const metadata = {
  title: "Neuer Vorgang",
}

export default async function NeuerVorgangPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; einheit?: string }>
}) {
  const { objekt, einheit } = await searchParams
  const { objekte, einheiten, kontakte } = await loadVorgangOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/vorgaenge"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Vorgänge
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neuer Vorgang
        </h1>
        <p className="text-muted-foreground text-sm">
          Vorgang erfassen und optional mit Objekt oder Einheit verknüpfen.
        </p>
      </div>

      <div className="max-w-4xl">
        <VorgangForm
          objekte={objekte}
          einheiten={einheiten}
          kontakte={kontakte}
          defaultObjektId={objekt}
          defaultEinheitId={einheit}
        />
      </div>
    </div>
  )
}
