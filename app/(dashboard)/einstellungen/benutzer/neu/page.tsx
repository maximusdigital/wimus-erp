import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { getUserMandanten } from "@/lib/mandanten"
import { BenutzerNeuForm } from "@/components/einstellungen/benutzer-neu-form"

export const metadata = { title: "Benutzer anlegen" }

export default async function BenutzerNeuPage() {
  const mandanten = await getUserMandanten()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen/benutzer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Benutzer
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Neuer Benutzer</h1>
        <p className="text-sm text-muted-foreground">
          Auth-Zugang + Mandanten-Zuordnung anlegen (Rollen folgen in Stufe 1).
        </p>
      </div>

      <BenutzerNeuForm mandanten={mandanten.map((m) => ({ id: m.id, name: m.name }))} />
    </div>
  )
}
