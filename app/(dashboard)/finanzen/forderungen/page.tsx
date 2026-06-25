import Link from "next/link"
import { Plus, Receipt } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ForderungKarte } from "@/components/forderungen/forderung-karte"
import { ForderungTabelle } from "@/components/forderungen/forderung-tabelle"
import type { ForderungMitRelationen } from "@/types/forderung"

export const metadata = {
  title: "Forderungen",
}

const SELECT =
  "*, kontakt:kontakte!kontakt_id(vorname, nachname, firmenname), mietvertrag:mietvertraege(aktenzeichen)"

export default async function ForderungenPage({
  searchParams,
}: {
  searchParams: Promise<{ kontakt?: string }>
}) {
  const { kontakt } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from("forderungen")
    .select(SELECT)
    .order("faellig_am", { ascending: true, nullsFirst: false })

  if (kontakt) query = query.eq("kontakt_id", kontakt)

  const { data, error } = await query
  const forderungen = (data ?? []) as unknown as ForderungMitRelationen[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Forderungen</h1>
          <p className="text-muted-foreground text-sm">
            {forderungen.length}{" "}
            {forderungen.length === 1 ? "Forderung" : "Forderungen"}
          </p>
        </div>
        <Button render={<Link href="/finanzen/forderungen/neu" />}>
          <Plus />
          <span>Neue Forderung</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : forderungen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Forderungen</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste Forderung an und verknüpfe Kontakt und Vertrag.
            </p>
          </div>
          <Button
            render={<Link href="/finanzen/forderungen/neu" />}
            variant="outline"
          >
            <Plus />
            <span>Forderung anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <ForderungTabelle forderungen={forderungen} />
          </div>
          <div className="space-y-2 md:hidden">
            {forderungen.map((f) => (
              <ForderungKarte key={f.id} forderung={f} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
