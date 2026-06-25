import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadObjektOptions } from "@/lib/betriebskosten-options"
import { AbrechnungseinheitForm } from "@/components/betriebskosten/abrechnungseinheit-form"

export const metadata = {
  title: "Neue Abrechnungseinheit",
}

export default async function NeueAbrechnungseinheitPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string }>
}) {
  const { objekt } = await searchParams
  const objekte = await loadObjektOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/betriebskosten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Betriebskosten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Abrechnungseinheit
        </h1>
        <p className="text-muted-foreground text-sm">
          Abrechnungseinheit für die Betriebskosten-Umlage anlegen.
        </p>
      </div>

      <div className="max-w-4xl">
        <AbrechnungseinheitForm objekte={objekte} defaultObjektId={objekt} />
      </div>
    </div>
  )
}
