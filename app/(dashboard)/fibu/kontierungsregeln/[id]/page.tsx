import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { KontierungsregelForm } from "@/components/fibu/kontierungsregel-form"
import { DeleteKontierungsregelButton } from "@/components/fibu/delete-kontierungsregel-button"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"
import type { Kontierungsregel } from "@/types/kontierungsregel"

export const metadata = {
  title: "Kontierungsregel bearbeiten",
}

export default async function KontierungsregelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: rData }, { data: fData }] = await Promise.all([
    supabase.from("kontierungsregeln").select("*").eq("id", id).maybeSingle(),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
  ])

  const regel = rData as Kontierungsregel | null
  if (!regel) notFound()
  const firmen = (fData ?? []) as FirmaOption[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/kontierungsregeln"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kontierungsregeln
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Regel: {regel.match}
          </h1>
          <DeleteKontierungsregelButton id={regel.id} label={regel.match} />
        </div>
      </div>

      <div className="max-w-4xl">
        <KontierungsregelForm regel={regel} firmen={firmen} />
      </div>
    </div>
  )
}
