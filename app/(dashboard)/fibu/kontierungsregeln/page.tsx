import Link from "next/link"
import { Plus, Receipt } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { KontierungsregelKarte } from "@/components/fibu/kontierungsregel-karte"
import { KontierungsregelTabelle } from "@/components/fibu/kontierungsregel-tabelle"
import type { KontierungsregelMitFirma } from "@/types/kontierungsregel"

export const metadata = {
  title: "Kontierungsregeln",
}

export default async function KontierungsregelnPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("kontierungsregeln")
    .select("*, firma:firmen(id, name, kuerzel)")
    .order("prioritaet", { ascending: true })

  const regeln = (data ?? []) as KontierungsregelMitFirma[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Kontierungsregeln
          </h1>
          <p className="text-muted-foreground text-sm">
            {regeln.length} {regeln.length === 1 ? "Regel" : "Regeln"} ·
            deterministische Kontierung (Match → Soll-Konto)
          </p>
        </div>
        <Button render={<Link href="/fibu/kontierungsregeln/neu" />}>
          <Plus />
          <span>Neue Regel</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : regeln.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Kontierungsregeln</p>
            <p className="text-muted-foreground text-sm">
              Lege Regeln an, die Belege deterministisch auf SKR-Konten
              kontieren – ohne LLM-Drift.
            </p>
          </div>
          <Button
            render={<Link href="/fibu/kontierungsregeln/neu" />}
            variant="outline"
          >
            <Plus />
            <span>Regel anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <KontierungsregelTabelle regeln={regeln} />
          </div>
          <div className="space-y-2 md:hidden">
            {regeln.map((r) => (
              <KontierungsregelKarte key={r.id} regel={r} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
