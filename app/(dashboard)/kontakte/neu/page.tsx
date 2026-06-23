import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import {
  buildVertragOptionen,
  loadVertragZuordnungen,
} from "@/lib/vertrag-zuordnung"
import { KontaktForm } from "@/components/kontakte/kontakt-form"

export const metadata = {
  title: "Neuer Kontakt",
}

export default async function NeuerKontaktPage() {
  const { options: vertraege } = buildVertragOptionen(
    await loadVertragZuordnungen(),
    "mieter_id"
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/kontakte"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kontakte
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neuer Kontakt
        </h1>
        <p className="text-muted-foreground text-sm">
          Mieter, Eigentümer, Dienstleister oder weitere Kontakte erfassen.
        </p>
      </div>

      <div className="max-w-4xl">
        <KontaktForm vertraege={vertraege} />
      </div>
    </div>
  )
}
