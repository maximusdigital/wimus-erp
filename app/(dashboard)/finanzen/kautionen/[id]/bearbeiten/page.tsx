import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadFinanzenOptions } from "@/lib/finanzen-options"
import { KautionForm } from "@/components/kautionen/kaution-form"
import type { KautionMitRelationen } from "@/types/kaution"

export const metadata = {
  title: "Kaution bearbeiten",
}

export default async function KautionBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .schema("wimus")
    .from("kautionen")
    .select("*, vertrag:mietvertraege(aktenzeichen)")
    .eq("id", id)
    .maybeSingle()

  const kaution = data as unknown as KautionMitRelationen | null

  if (!kaution) {
    notFound()
  }

  const { vertraege } = await loadFinanzenOptions()
  const titel = kaution.vertrag?.aktenzeichen
    ? `Kaution ${kaution.vertrag.aktenzeichen}`
    : "Kaution"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/finanzen/kautionen/${kaution.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Kaution
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Kautionsdaten aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <KautionForm kaution={kaution} vertraege={vertraege} />
      </div>
    </div>
  )
}
