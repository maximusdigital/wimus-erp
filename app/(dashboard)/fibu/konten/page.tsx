import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { FibuKontoKarte } from "@/components/fibu/fibu-konto-karte"
import { FibuKontoTabelle } from "@/components/fibu/fibu-konto-tabelle"
import type { FibuKontoMitFirma } from "@/types/fibu-konto"

export const metadata = {
  title: "Kontenrahmen",
}

export default async function KontenPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("fibu_konten")
    .select("*, firma:firmen(id, name, kuerzel)")
    .order("kontonummer", { ascending: true })

  const konten = (data ?? []) as FibuKontoMitFirma[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kontenrahmen</h1>
          <p className="text-muted-foreground text-sm">
            {konten.length} {konten.length === 1 ? "Konto" : "Konten"} · SKR /
            EÜR je Buchungskreis
          </p>
        </div>
        <Button render={<Link href="/fibu/konten/neu" />}>
          <Plus />
          <span>Neues Konto</span>
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : konten.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BookOpen className="size-6" />
          </div>
          <div>
            <p className="font-medium">Kein Kontenrahmen</p>
            <p className="text-muted-foreground text-sm">
              Lege SKR-/EÜR-Konten an, auf die die Kontierungsregeln verweisen.
            </p>
          </div>
          <Button render={<Link href="/fibu/konten/neu" />} variant="outline">
            <Plus />
            <span>Konto anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <FibuKontoTabelle konten={konten} />
          </div>
          <div className="space-y-2 md:hidden">
            {konten.map((k) => (
              <FibuKontoKarte key={k.id} konto={k} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
