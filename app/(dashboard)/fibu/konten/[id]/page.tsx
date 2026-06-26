import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { FibuKontoForm } from "@/components/fibu/fibu-konto-form"
import { DeleteFibuKontoButton } from "@/components/fibu/delete-fibu-konto-button"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"
import type { FibuKonto } from "@/types/fibu-konto"

export const metadata = {
  title: "Konto bearbeiten",
}

export default async function KontoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: kData }, { data: fData }] = await Promise.all([
    supabase.from("fibu_konten").select("*").eq("id", id).maybeSingle(),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
  ])

  const konto = kData as FibuKonto | null
  if (!konto) notFound()
  const firmen = (fData ?? []) as FirmaOption[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/konten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Kontenrahmen
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            {konto.kontonummer} · {konto.bezeichnung}
          </h1>
          <DeleteFibuKontoButton
            id={konto.id}
            label={`${konto.kontonummer} ${konto.bezeichnung}`}
          />
        </div>
      </div>

      <div className="max-w-4xl">
        <FibuKontoForm konto={konto} firmen={firmen} />
      </div>
    </div>
  )
}
