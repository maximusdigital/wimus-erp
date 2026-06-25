import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { getFirmen } from "@/lib/firmen"
import { ProjektForm, type ProjektEdit } from "@/components/einstellungen/projekt-form"
import { orderProjekteTree, type Projekt } from "@/types/projekt"

export const metadata = { title: "Projekt bearbeiten" }

export default async function ProjektBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [firmen, projekteRes, projektRes] = await Promise.all([
    getFirmen(),
    supabase
      .schema("wimus")
      .from("projekte")
      .select("id, name, kuerzel, typ, parent_projekt_id, ebene, ci_farbe_primary"),
    supabase
      .schema("wimus")
      .from("projekte")
      .select(
        "id, name, kuerzel, typ, status, parent_projekt_id, ebene, firma_id, marke, domain, email, telefon, whatsapp, ci_farbe_primary, aktiv"
      )
      .eq("id", id)
      .maybeSingle(),
  ])

  const projekt = projektRes.data as ProjektEdit | null
  if (!projekt) notFound()

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
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{projekt.name}</h1>
      </div>
      <ProjektForm projekt={projekt} firmen={firmen} projekte={projekte} />
    </div>
  )
}
