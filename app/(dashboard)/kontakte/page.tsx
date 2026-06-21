import Link from "next/link"
import { Plus, Users } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { DEMO_KONTAKTE } from "@/lib/dev/demo-kontakte"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Button } from "@/components/ui/button"
import { KontaktKarte } from "@/components/kontakte/kontakt-karte"
import { KontaktTabelle } from "@/components/kontakte/kontakt-tabelle"
import {
  KONTAKT_TYPEN,
  KONTAKT_TYP_LABELS,
  type Kontakt,
} from "@/types/kontakt"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Kontakte",
}

export default async function KontaktePage({
  searchParams,
}: {
  searchParams: Promise<{ typ?: string }>
}) {
  const { typ } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from("kontakte")
    .select("*")
    .order("nachname", { nullsFirst: false })
    .order("firma", { nullsFirst: false })

  if (typ) {
    query = query.eq("typ", typ)
  }

  const { data, error } = await query

  let kontakte = (data ?? []) as Kontakt[]

  // Vorschau/Demo: Demo-Daten, damit die Liste ohne DB befüllt ist.
  if (isPreviewNoAuth() && kontakte.length === 0) {
    kontakte = typ ? DEMO_KONTAKTE.filter((k) => k.typ === typ) : DEMO_KONTAKTE
  }

  const filterHref = (t?: string) => (t ? `/kontakte?typ=${t}` : "/kontakte")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kontakte</h1>
          <p className="text-muted-foreground text-sm">
            {kontakte.length} {kontakte.length === 1 ? "Kontakt" : "Kontakte"}
          </p>
        </div>
        <Button render={<Link href="/kontakte/neu" />}>
          <Plus />
          <span>Neuer Kontakt</span>
        </Button>
      </div>

      {/* Typ-Filter */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={filterHref()}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            !typ ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Alle
        </Link>
        {KONTAKT_TYPEN.map((t) => (
          <Link
            key={t}
            href={filterHref(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              typ === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {KONTAKT_TYP_LABELS[t]}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : kontakte.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine Kontakte</p>
            <p className="text-muted-foreground text-sm">
              Lege Mieter, Eigentümer oder Dienstleister an.
            </p>
          </div>
          <Button render={<Link href="/kontakte/neu" />} variant="outline">
            <Plus />
            <span>Kontakt anlegen</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <KontaktTabelle kontakte={kontakte} />
          </div>
          {/* Mobile: Karten-Liste */}
          <div className="space-y-2 md:hidden">
            {kontakte.map((k) => (
              <KontaktKarte key={k.id} kontakt={k} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
