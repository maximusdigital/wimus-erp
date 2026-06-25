import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import {
  loadAbrechnungseinheitOptions,
  loadBkArtOptions,
  loadObjektOptions,
} from "@/lib/betriebskosten-options"
import { PositionForm } from "@/components/betriebskosten/position-form"

export const metadata = {
  title: "Neue Kostenposition",
}

export default async function NeueKostenpositionPage() {
  const [objekte, bkArten, abrechnungseinheiten] = await Promise.all([
    loadObjektOptions(),
    loadBkArtOptions(),
    loadAbrechnungseinheitOptions(),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/betriebskosten/positionen"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kostenpositionen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Kostenposition
        </h1>
        <p className="text-muted-foreground text-sm">
          Kostenposition erfassen und einer Abrechnungseinheit zuordnen.
        </p>
      </div>

      <div className="max-w-4xl">
        <PositionForm
          objekte={objekte}
          bkArten={bkArten}
          abrechnungseinheiten={abrechnungseinheiten}
        />
      </div>
    </div>
  )
}
