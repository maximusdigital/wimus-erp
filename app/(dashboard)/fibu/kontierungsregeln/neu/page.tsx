import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { KontierungsregelForm } from "@/components/fibu/kontierungsregel-form"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"

export const metadata = {
  title: "Neue Kontierungsregel",
}

export default async function NeueKontierungsregelPage() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("firmen")
    .select("id, name, kuerzel")
    .order("name")
  const firmen = (data ?? []) as FirmaOption[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/kontierungsregeln"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Kontierungsregeln
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neue Kontierungsregel
        </h1>
        <p className="text-muted-foreground text-sm">
          Match (Gewerk/Lieferant) deterministisch auf ein Soll-Konto abbilden.
        </p>
      </div>

      <div className="max-w-4xl">
        <KontierungsregelForm firmen={firmen} />
      </div>
    </div>
  )
}
