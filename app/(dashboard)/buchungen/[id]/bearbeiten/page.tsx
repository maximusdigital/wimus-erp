import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadBuchungOptions } from "@/lib/buchung-options"
import { BuchungForm } from "@/components/buchungen/buchung-form"
import type { Buchung } from "@/types/buchung"

export const metadata = {
  title: "Buchung bearbeiten",
}

export default async function BuchungBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("buchungen_kzv")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const buchung = data as Buchung | null

  if (!buchung) {
    notFound()
  }

  const { einheiten, kontakte } = await loadBuchungOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/buchungen/${buchung.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Buchung
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Buchung bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Buchungsdaten aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <BuchungForm
          buchung={buchung}
          einheiten={einheiten}
          kontakte={kontakte}
        />
      </div>
    </div>
  )
}
