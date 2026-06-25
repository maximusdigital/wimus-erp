import Link from "next/link"
import { AlertTriangle, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { MahnungKarte } from "@/components/mahnungen/mahnung-karte"
import { MahnungTabelle } from "@/components/mahnungen/mahnung-tabelle"
import type { MahnungMitRelationen } from "@/types/mahnung"

export const metadata = {
  title: "Mahnungen",
}

const SELECT = "*, vertrag:mietvertraege(aktenzeichen)"

export default async function MahnungenPage({
  searchParams,
}: {
  searchParams: Promise<{ vertrag?: string }>
}) {
  const { vertrag } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .schema("wimus")
    .from("mahnungen")
    .select(SELECT)
    .order("faellig_am", { ascending: false, nullsFirst: false })

  if (vertrag) query = query.eq("mietvertrag_id", vertrag)

  const { data, error } = await query
  const mahnungen = (data ?? []) as unknown as MahnungMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mahnungen</h1>
          <p className="text-muted-foreground text-sm">
            {mahnungen.length} {mahnungen.length === 1 ? "Mahnung" : "Mahnungen"}
          </p>
        </div>
        <Button render={<Link href="/finanzen/mahnungen/neu" />}>
          <Plus />
          <span>Neue Mahnung</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : mahnungen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Mahnungen</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste Mahnung an und verknüpfe Vertrag und Mieter.
            </p>
          </div>
          <Button
            render={<Link href="/finanzen/mahnungen/neu" />}
            variant="outline"
          >
            <Plus />
            <span>Mahnung anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <MahnungTabelle mahnungen={mahnungen} />
          </div>
          <div className="space-y-2 md:hidden">
            {mahnungen.map((m) => (
              <MahnungKarte key={m.id} mahnung={m} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
