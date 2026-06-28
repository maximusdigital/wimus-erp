import { createServerClient } from "@/lib/supabase/server"
import { listTypen } from "@/lib/felder/typen"
import { KontakttypenVerwaltung } from "@/components/felder/kontakttypen-verwaltung"

export const metadata = { title: "Einstellungen – Kontakttypen" }

export default async function KontakttypenPage() {
  const supabase = await createServerClient()
  const typen = await listTypen(supabase)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Kontakttypen</h1>
        <p className="text-sm text-muted-foreground">
          Typen für Personen &amp; Organisationen (mehrfach zuweisbar). System-Typen
          (Mieter/Lieferant/Eigentümer …) sind geschützt – sie tragen Code-Logik.
        </p>
      </div>
      <KontakttypenVerwaltung typen={typen} />
    </div>
  )
}
