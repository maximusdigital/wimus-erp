import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { GesellschafterForm } from "@/components/fibu/gesellschafter-form"
import type { Gesellschafter } from "@/types/gesellschafter"

export const metadata = {
  title: "Gesellschafter bearbeiten",
}

export default async function GesellschafterBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("gesellschafter")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const gesellschafter = data as Gesellschafter | null
  if (!gesellschafter) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/fibu/gesellschafter/${id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Gesellschafter
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {gesellschafter.name} bearbeiten
        </h1>
      </div>

      <div className="max-w-4xl">
        <GesellschafterForm gesellschafter={gesellschafter} />
      </div>
    </div>
  )
}
