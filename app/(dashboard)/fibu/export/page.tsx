import { Download } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = { title: "DATEV-Export" }

const inputCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export default async function ExportPage() {
  const supabase = await createServerClient()
  const jahr = new Date().getFullYear()

  const [{ data: firmenData }, { count }] = await Promise.all([
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
    supabase.from("fibu_buchungen").select("id", { count: "exact", head: true }),
  ])
  const firmen = (firmenData ?? []) as {
    id: string
    name: string
    kuerzel: string | null
  }[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">DATEV-Export</h1>
        <p className="text-muted-foreground text-sm">
          Buchungsstapel als DATEV-EXTF-CSV (KOST1=K1, KOST2=K2, stabile
          Buchungs-ID) → TaxPool-Import. {count ?? 0} Buchungen vorhanden.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export erzeugen</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            action="/api/fibu/export"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          >
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium" htmlFor="firma_id">
                Firma (Buchungskreis)
              </label>
              <select id="firma_id" name="firma_id" className={inputCls} defaultValue="">
                <option value="">Alle Firmen</option>
                {firmen.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.kuerzel ? ` (${f.kuerzel})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="von">
                Von
              </label>
              <input
                id="von"
                name="von"
                type="date"
                defaultValue={`${jahr}-01-01`}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bis">
                Bis
              </label>
              <input
                id="bis"
                name="bis"
                type="date"
                defaultValue={`${jahr}-12-31`}
                className={inputCls}
              />
            </div>
            <div className="lg:col-span-4">
              <Button type="submit">
                <Download />
                <span>EXTF-CSV herunterladen</span>
              </Button>
            </div>
          </form>
          <p className="text-muted-foreground mt-3 text-xs">
            Hinweis: Das exakte 116-Spalten-Layout (Spec-OP-1) ist noch offen –
            exportiert wird der konsistente, per Spaltenname importierbare Kern.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
