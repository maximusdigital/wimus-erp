import Link from "next/link"
import { CalendarClock, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { FristKarte } from "@/components/fristen/frist-karte"
import { FristTabelle } from "@/components/fristen/frist-tabelle"
import { tageBisFaellig } from "@/lib/utils/fristen"
import type { Frist } from "@/types/frist"

export const metadata = {
  title: "Fristen & Termine",
}

export default async function FristenPage() {
  const supabase = await createServerClient()
  const heute = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("fristen")
    .select("*")
    .order("faellig_am", { ascending: true, nullsFirst: false })

  const fristen = (data ?? []) as Frist[]

  const offen = fristen.filter((f) => f.status !== "erledigt")
  let ueberfaellig = 0
  let heuteFaellig = 0
  let in7Tagen = 0
  for (const f of offen) {
    const t = tageBisFaellig(f.faellig_am, heute)
    if (t === null) continue
    if (t < 0) ueberfaellig++
    else if (t === 0) heuteFaellig++
    else if (t <= 7) in7Tagen++
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Fristen &amp; Termine
          </h1>
          <p className="text-muted-foreground text-sm">
            {fristen.length} {fristen.length === 1 ? "Frist" : "Fristen"} ·{" "}
            <span className="text-danger">{ueberfaellig} überfällig</span> ·{" "}
            {heuteFaellig} heute · {in7Tagen} in 7 Tagen
          </p>
        </div>
        <Button render={<Link href="/fristen/neu" />}>
          <Plus />
          <span>Neue Frist</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : fristen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarClock className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Fristen</p>
            <p className="text-muted-foreground text-sm">
              Lege die erste Frist an – z. B. Mieterhöhung, Wartung oder
              Verjährung.
            </p>
          </div>
          <Button render={<Link href="/fristen/neu" />} variant="outline">
            <Plus />
            <span>Frist anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <FristTabelle fristen={fristen} heute={heute} />
          </div>
          <div className="space-y-2 md:hidden">
            {fristen.map((f) => (
              <FristKarte key={f.id} frist={f} heute={heute} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
