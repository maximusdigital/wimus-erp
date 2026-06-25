import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadObjektOptions } from "@/lib/betriebskosten-options"
import { AbrechnungseinheitForm } from "@/components/betriebskosten/abrechnungseinheit-form"
import type { Abrechnungseinheit } from "@/types/betriebskosten"

export const metadata = {
  title: "Abrechnungseinheit bearbeiten",
}

export default async function AbrechnungseinheitBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("abrechnungseinheiten")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const abrechnungseinheit = data as Abrechnungseinheit | null

  if (!abrechnungseinheit) {
    notFound()
  }

  const objekte = await loadObjektOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/betriebskosten/${abrechnungseinheit.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Abrechnungseinheit
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {abrechnungseinheit.bezeichnung} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Stammdaten der Abrechnungseinheit aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <AbrechnungseinheitForm
          abrechnungseinheit={abrechnungseinheit}
          objekte={objekte}
        />
      </div>
    </div>
  )
}
