import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { DEMO_OBJEKTE } from "@/lib/dev/demo-objekte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import {
  buildVertragOptionen,
  loadVertragZuordnungen,
} from "@/lib/vertrag-zuordnung"
import { EinheitForm } from "@/components/einheiten/einheit-form"
import type { ObjektOption } from "@/types/einheit"

export const metadata = {
  title: "Neue Einheit",
}

export default async function NeueEinheitPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string }>
}) {
  const { objekt } = await searchParams
  const supabase = await createServerClient()
  const { data } = await supabase
    .schema("wimus")
    .from("objekte")
    .select("id, kuerzel, bezeichnung")
    .order("kuerzel")

  let objekte = (data ?? []) as ObjektOption[]
  if (isPreviewNoAuth() && objekte.length === 0) {
    objekte = DEMO_OBJEKTE.map((o) => ({
      id: o.id,
      kuerzel: o.kuerzel,
      bezeichnung: o.kuerzel,
    }))
  }

  const { options: vertraege } = buildVertragOptionen(
    await loadVertragZuordnungen(),
    "einheit_id"
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einheiten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Einheiten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Einheit
        </h1>
        <p className="text-muted-foreground text-sm">
          Wohnung, Zimmer, Gewerbe oder Stellplatz erfassen.
        </p>
      </div>

      <div className="max-w-4xl">
        <EinheitForm
          objekte={objekte}
          defaultObjektId={objekt}
          vertraege={vertraege}
        />
      </div>
    </div>
  )
}
