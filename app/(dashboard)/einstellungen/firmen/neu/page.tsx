import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { getFirmen } from "@/lib/firmen"
import { FirmaForm } from "@/components/einstellungen/firma-form"

export const metadata = { title: "Neue Firma" }

export default async function NeueFirmaPage() {
  const firmen = await getFirmen()
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
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Neue Firma</h1>
      </div>
      <FirmaForm firmen={firmen} />
    </div>
  )
}
