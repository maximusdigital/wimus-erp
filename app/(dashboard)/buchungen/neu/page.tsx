import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadBuchungOptions } from "@/lib/buchung-options"
import { BuchungForm } from "@/components/buchungen/buchung-form"

export const metadata = {
  title: "Neue Buchung",
}

export default async function NeueBuchungPage({
  searchParams,
}: {
  searchParams: Promise<{ einheit?: string; gast?: string }>
}) {
  const { einheit, gast } = await searchParams
  const { einheiten, kontakte } = await loadBuchungOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/buchungen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Buchungen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Buchung
        </h1>
        <p className="text-muted-foreground text-sm">
          KZV-Buchung erfassen und mit Einheit und Gast verknüpfen.
        </p>
      </div>

      <div className="max-w-4xl">
        <BuchungForm
          einheiten={einheiten}
          kontakte={kontakte}
          defaultEinheitId={einheit}
          defaultGastId={gast}
        />
      </div>
    </div>
  )
}
