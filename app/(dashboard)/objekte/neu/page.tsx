import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { loadEinheitZuordnungen } from "@/lib/einheit-zuordnung"
import {
  buildVertragOptionen,
  loadVertragZuordnungen,
} from "@/lib/vertrag-zuordnung"
import { ObjektForm } from "@/components/objekte/objekt-form"

export const metadata = {
  title: "Neues Objekt",
}

export default async function NeuesObjektPage() {
  const einheiten = await loadEinheitZuordnungen()
  const { options: vertraege } = buildVertragOptionen(
    await loadVertragZuordnungen(),
    "objekt_id"
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/objekte"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Objekte
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neues Objekt
        </h1>
        <p className="text-muted-foreground text-sm">
          Stammdaten für ein neues Objekt erfassen.
        </p>
      </div>

      <div className="max-w-4xl">
        <ObjektForm einheiten={einheiten} vertraege={vertraege} />
      </div>
    </div>
  )
}
