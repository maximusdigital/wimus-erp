import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { BkArtForm } from "@/components/einstellungen/bk-art-form"
import type { BkArt } from "@/types/bk-art"

export const metadata = { title: "BK-Kostenart bearbeiten" }

export default async function BkArtBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("bk_arten")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const bkArt = data as BkArt | null
  if (!bkArt) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen/bk-arten"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu BK-Kostenarten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {bkArt.bezeichnung}
        </h1>
      </div>
      <BkArtForm bkArt={bkArt} />
    </div>
  )
}
