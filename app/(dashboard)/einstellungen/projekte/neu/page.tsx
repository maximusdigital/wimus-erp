import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { getFirmen } from "@/lib/firmen"
import { ProjektForm } from "@/components/einstellungen/projekt-form"
import { orderProjekteTree, type Projekt } from "@/types/projekt"

export const metadata = { title: "Neues Projekt" }

export default async function NeuesProjektPage() {
  const supabase = await createServerClient()
  const [firmen, projekteRes] = await Promise.all([
    getFirmen(),
    supabase
      .schema("wimus")
      .from("projekte")
      .select("id, name, kuerzel, typ, parent_projekt_id, ebene, ci_farbe_primary"),
  ])
  const projekte = orderProjekteTree((projekteRes.data as Projekt[] | null) ?? [])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen/projekte"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Projekte
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Neues Projekt</h1>
      </div>
      <ProjektForm firmen={firmen} projekte={projekte} />
    </div>
  )
}
