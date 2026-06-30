import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FelderWerte } from "@/components/felder/felder-werte"
import { HistorieTab } from "@/components/historie/historie-tab"
import type { BezugTyp } from "@/lib/historie/types"

/**
 * Dezentrale Detailseiten-Erweiterung (Modul 008/009 Stufe 2): „Weitere Felder"
 * (Custom-Field-Werte) + „Historie" (Aktivitäts-Zeitstrahl) als ein Abschnitt.
 * Selbst-enthaltenes 2-Spalten-Grid → auf jeder Kern-Detailseite mit einer Zeile
 * einhängbar. `feldEntitaet` (Felder-Entität: person/organisation/objekt/einheit/
 * vorgang) kann vom `bezugTyp` der Historie abweichen (z.B. Kontakt → person/firma).
 */
export function DetailZusatz({
  feldEntitaet,
  bezugTyp,
  bezugId,
  hatUntergeordnete = false,
}: {
  feldEntitaet: string
  bezugTyp: BezugTyp
  bezugId: string
  hatUntergeordnete?: boolean
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weitere Felder</CardTitle>
        </CardHeader>
        <CardContent>
          <FelderWerte entitaet={feldEntitaet} entitaetId={bezugId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historie</CardTitle>
        </CardHeader>
        <CardContent>
          <HistorieTab bezugTyp={bezugTyp} bezugId={bezugId} hatUntergeordnete={hatUntergeordnete} />
        </CardContent>
      </Card>
    </div>
  )
}
