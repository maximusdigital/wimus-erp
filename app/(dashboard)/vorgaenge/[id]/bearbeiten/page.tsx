import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadVorgangOptions } from "@/lib/vorgang-options"
import { VorgangForm } from "@/components/vorgaenge/vorgang-form"
import type { Vorgang } from "@/types/vorgang"

export const metadata = {
  title: "Vorgang bearbeiten",
}

export default async function VorgangBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("vorgaenge")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const vorgang = data as Vorgang | null

  if (!vorgang) {
    notFound()
  }

  const { objekte, einheiten } = await loadVorgangOptions()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/vorgaenge/${vorgang.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Vorgang
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {vorgang.titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">
          Vorgangsdaten aktualisieren.
        </p>
      </div>

      <div className="max-w-4xl">
        <VorgangForm
          vorgang={vorgang}
          objekte={objekte}
          einheiten={einheiten}
        />
      </div>
    </div>
  )
}
