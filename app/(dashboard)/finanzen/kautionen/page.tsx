import Link from "next/link"
import { PiggyBank, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { KautionKarte } from "@/components/kautionen/kaution-karte"
import { KautionTabelle } from "@/components/kautionen/kaution-tabelle"
import type { KautionMitRelationen } from "@/types/kaution"

export const metadata = {
  title: "Kautionen",
}

const SELECT = "*, vertrag:mietvertraege(aktenzeichen)"

export default async function KautionenPage({
  searchParams,
}: {
  searchParams: Promise<{ vertrag?: string }>
}) {
  const { vertrag } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .schema("wimus")
    .from("kautionen")
    .select(SELECT)
    .order("created_at", { ascending: false })

  if (vertrag) query = query.eq("mietvertrag_id", vertrag)

  const { data, error } = await query
  const kautionen = (data ?? []) as unknown as KautionMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kautionen</h1>
          <p className="text-muted-foreground text-sm">
            {kautionen.length} {kautionen.length === 1 ? "Kaution" : "Kautionen"}
          </p>
        </div>
        <Button render={<Link href="/finanzen/kautionen/neu" />}>
          <Plus />
          <span>Neue Kaution</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : kautionen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PiggyBank className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Kautionen</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste Kaution an und verknüpfe Vertrag und Mieter.
            </p>
          </div>
          <Button
            render={<Link href="/finanzen/kautionen/neu" />}
            variant="outline"
          >
            <Plus />
            <span>Kaution anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <KautionTabelle kautionen={kautionen} />
          </div>
          <div className="space-y-2 md:hidden">
            {kautionen.map((k) => (
              <KautionKarte key={k.id} kaution={k} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
