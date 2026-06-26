import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { LieferantForm } from "@/components/fibu/lieferant-form"
import { DeleteLieferantButton } from "@/components/fibu/delete-lieferant-button"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"
import type { Lieferant } from "@/types/lieferant"

export const metadata = {
  title: "Lieferant bearbeiten",
}

export default async function LieferantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: lData }, { data: fData }] = await Promise.all([
    supabase.from("lieferanten").select("*").eq("id", id).maybeSingle(),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
  ])

  const lieferant = lData as Lieferant | null
  if (!lieferant) notFound()
  const firmen = (fData ?? []) as FirmaOption[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/lieferanten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Lieferanten
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            {lieferant.name}
          </h1>
          <DeleteLieferantButton id={lieferant.id} label={lieferant.name} />
        </div>
      </div>

      <div className="max-w-4xl">
        <LieferantForm lieferant={lieferant} firmen={firmen} />
      </div>
    </div>
  )
}
