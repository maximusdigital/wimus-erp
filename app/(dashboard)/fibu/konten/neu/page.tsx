import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { FibuKontoForm } from "@/components/fibu/fibu-konto-form"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"

export const metadata = {
  title: "Neues Konto",
}

export default async function NeuesKontoPage() {
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
          href="/fibu/konten"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zum Kontenrahmen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Neues Konto</h1>
      </div>

      <div className="max-w-4xl">
        <FibuKontoForm firmen={firmen} />
      </div>
    </div>
  )
}
