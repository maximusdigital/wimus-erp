import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { loadFinanzenOptions } from "@/lib/finanzen-options"
import { MahnungForm } from "@/components/mahnungen/mahnung-form"
import { MAHN_STUFE_LABELS, type Mahnung } from "@/types/mahnung"

export const metadata = {
  title: "Mahnung bearbeiten",
}

export default async function MahnungBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .schema("wimus")
    .from("mahnungen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const mahnung = data as Mahnung | null

  if (!mahnung) {
    notFound()
  }

  const { vertraege } = await loadFinanzenOptions()
  const titel = MAHN_STUFE_LABELS[mahnung.stufe] ?? `Stufe ${mahnung.stufe}`

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/finanzen/mahnungen/${mahnung.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Mahnung
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">Mahndaten aktualisieren.</p>
      </div>

      <div className="max-w-4xl">
        <MahnungForm mahnung={mahnung} vertraege={vertraege} />
      </div>
    </div>
  )
}
