import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { FristForm } from "@/components/fristen/frist-form"
import { FRIST_TYP_LABELS, type Frist } from "@/types/frist"

export const metadata = {
  title: "Frist bearbeiten",
}

export default async function FristBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("fristen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const frist = data as Frist | null

  if (!frist) {
    notFound()
  }

  const titel =
    frist.bezeichnung || FRIST_TYP_LABELS[frist.frist_typ] || "Frist"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/fristen/${frist.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zur Frist
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {titel} bearbeiten
        </h1>
        <p className="text-muted-foreground text-sm">Fristdaten aktualisieren.</p>
      </div>

      <div className="max-w-4xl">
        <FristForm frist={frist} />
      </div>
    </div>
  )
}
