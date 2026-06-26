import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { LieferantForm } from "@/components/fibu/lieferant-form"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"

export const metadata = {
  title: "Neuer Lieferant",
}

export default async function NeuerLieferantPage() {
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
          href="/fibu/lieferanten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Lieferanten
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Neuer Lieferant
        </h1>
        <p className="text-muted-foreground text-sm">
          Kreditor mit Alias-Erkennung und Standard-Kontierung erfassen.
        </p>
      </div>

      <div className="max-w-4xl">
        <LieferantForm firmen={firmen} />
      </div>
    </div>
  )
}
