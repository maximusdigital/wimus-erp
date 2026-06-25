import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { getFirmen } from "@/lib/firmen"
import { FirmaForm, type FirmaEdit } from "@/components/einstellungen/firma-form"

export const metadata = { title: "Firma bearbeiten" }

export default async function FirmaBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const [firmen, firmaRes] = await Promise.all([
    getFirmen(),
    supabase
      .schema("wimus")
      .from("firmen")
      .select(
        "id, name, kuerzel, rechtsform, geschaeftsfuehrer, handelsregister_nr, handelsregister_gericht, steuernummer, ust_id, datev_mandant_nr, iban, bic, mutter_firma_id, ci_farbe_primary, aktiv"
      )
      .eq("id", id)
      .maybeSingle(),
  ])

  const firma = firmaRes.data as FirmaEdit | null
  if (!firma) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen/firmen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Firmen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{firma.name}</h1>
      </div>
      <FirmaForm firma={firma} firmen={firmen} />
    </div>
  )
}
