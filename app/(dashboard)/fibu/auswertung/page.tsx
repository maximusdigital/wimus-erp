import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PrintButton } from "@/components/fibu/print-button"
import { BalkenChart } from "@/components/charts/wimus-charts"
import { aggregateGuV, type GuvBuchung } from "@/lib/fibu/guv"
import { formatEUR } from "@/lib/utils/format"

export const metadata = { title: "Auswertung (GuV)" }

const inputCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

type Such = { firma_id?: string; von?: string; bis?: string }

export default async function AuswertungPage({
  searchParams,
}: {
  searchParams: Promise<Such>
}) {
  const sp = await searchParams
  const supabase = await createServerClient()
  const jahr = new Date().getFullYear()
  const von = sp.von || `${jahr}-01-01`
  const bis = sp.bis || `${jahr}-12-31`

  const { data: firmenData } = await supabase
    .from("firmen")
    .select("id, name, kuerzel")
    .order("name")
  const firmen = (firmenData ?? []) as { id: string; name: string; kuerzel: string | null }[]
  const firmaId = sp.firma_id || ""

  let query = supabase
    .from("fibu_buchungen")
    .select("soll_konto, haben_konto, betrag_brutto")
    .gte("datum", von)
    .lte("datum", bis)
  if (firmaId) query = query.eq("firma_id", firmaId)
  const { data } = await query

  const guv = aggregateGuV((data ?? []) as GuvBuchung[])
  const firmaName = firmaId ? firmen.find((f) => f.id === firmaId)?.name : "Alle Firmen"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Auswertung — GuV-Kurzform</h1>
          <p className="text-muted-foreground text-sm">
            {firmaName} · {von} bis {bis} · Controlling-Sicht (kein testierter Abschluss)
          </p>
        </div>
        <PrintButton />
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Parameter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium" htmlFor="firma_id">Firma</label>
              <select id="firma_id" name="firma_id" defaultValue={firmaId} className={inputCls}>
                <option value="">Alle Firmen</option>
                {firmen.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="von">Von</label>
              <input id="von" name="von" type="date" defaultValue={von} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bis">Bis</label>
              <input id="bis" name="bis" type="date" defaultValue={bis} className={inputCls} />
            </div>
            <div className="sm:col-span-4">
              <Button type="submit">Berechnen</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {guv.aufwendungen.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufwendungen je Konto</CardTitle>
          </CardHeader>
          <CardContent>
            <BalkenChart
              data={guv.aufwendungen}
              kategorie="konto"
              serien={[{ key: "betrag", label: "Aufwand" }]}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Erträge</CardTitle></CardHeader>
          <CardContent>
            <GuvTabelle zeilen={guv.ertraege} summe={guv.summe_ertrag} label="Summe Erträge" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Aufwendungen</CardTitle></CardHeader>
          <CardContent>
            <GuvTabelle zeilen={guv.aufwendungen} summe={guv.summe_aufwand} label="Summe Aufwendungen" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <span className="font-medium">Ergebnis (Erträge − Aufwendungen)</span>
          <span
            className={`text-lg font-semibold tabular-nums ${guv.ergebnis < 0 ? "text-danger" : "text-success"}`}
          >
            {formatEUR(guv.ergebnis)}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}

function GuvTabelle({
  zeilen,
  summe,
  label,
}: {
  zeilen: { konto: string; betrag: number }[]
  summe: number
  label: string
}) {
  if (zeilen.length === 0) {
    return <p className="text-muted-foreground text-sm">Keine Buchungen im Zeitraum.</p>
  }
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Konto</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zeilen.map((z) => (
            <TableRow key={z.konto}>
              <TableCell className="tabular-nums">{z.konto}</TableCell>
              <TableCell className="text-right tabular-nums">{formatEUR(z.betrag)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatEUR(summe)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
