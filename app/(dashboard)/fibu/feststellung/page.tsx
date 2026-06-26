import { Calculator } from "lucide-react"

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
import { formatEUR } from "@/lib/utils/format"
import { ergebnisverteilung, type Beteiligung } from "@/lib/utils/fibu"

export const metadata = {
  title: "Feststellungs-Vorschau",
}

type Such = {
  firma_id?: string
  von?: string
  bis?: string
  ergebnis?: string
}

const inputCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export default async function FeststellungPage({
  searchParams,
}: {
  searchParams: Promise<Such>
}) {
  const sp = await searchParams
  const supabase = await createServerClient()

  const { data: firmenData } = await supabase
    .from("firmen")
    .select("id, name, kuerzel")
    .order("name")
  const firmen = (firmenData ?? []) as {
    id: string
    name: string
    kuerzel: string | null
  }[]

  const firmaId = sp.firma_id || firmen[0]?.id || ""
  const von = sp.von || "2025-01-01"
  const bis = sp.bis || "2025-12-31"
  const ergebnis = sp.ergebnis ? Number(sp.ergebnis.replace(",", ".")) : 0

  type BetRow = Beteiligung & {
    gesellschafter?: { id: string; name: string } | null
  }
  let beteiligungen: BetRow[] = []
  if (firmaId) {
    const { data } = await supabase
      .from("beteiligungen")
      .select(
        "gesellschafter_id, quote, gueltig_ab, gueltig_bis, gesellschafter:gesellschafter(id, name)"
      )
      .eq("firma_id", firmaId)
    beteiligungen = (data ?? []) as unknown as BetRow[]
  }

  const namen = new Map<string, string>()
  for (const b of beteiligungen) {
    if (b.gesellschafter) namen.set(b.gesellschafter_id, b.gesellschafter.name)
  }

  const verteilung =
    beteiligungen.length > 0 && ergebnis !== 0
      ? ergebnisverteilung(beteiligungen, ergebnis, von, bis)
      : []
  const summe = verteilung.reduce((s, v) => s + v.anteil_betrag, 0)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Feststellungs-Vorschau
        </h1>
        <p className="text-muted-foreground text-sm">
          Periodengenaue Ergebnisverteilung je Gesellschafter (zeitanteilig bei
          Quotenwechsel). Controlling-Vorschau – verbindlich via TaxPool.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parameter</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
          >
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium" htmlFor="firma_id">
                Firma (Buchungskreis)
              </label>
              <select
                id="firma_id"
                name="firma_id"
                defaultValue={firmaId}
                className={inputCls}
              >
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
                Periode von
              </label>
              <input
                id="von"
                name="von"
                type="date"
                defaultValue={von}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bis">
                Periode bis
              </label>
              <input
                id="bis"
                name="bis"
                type="date"
                defaultValue={bis}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="ergebnis">
                Ergebnis (€)
              </label>
              <input
                id="ergebnis"
                name="ergebnis"
                inputMode="decimal"
                defaultValue={sp.ergebnis ?? ""}
                placeholder="z. B. 100000"
                className={inputCls}
              />
            </div>
            <div className="lg:col-span-5">
              <Button type="submit">Berechnen</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          {beteiligungen.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Calculator className="size-6 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Keine Beteiligungen für diese Firma – im Gesellschafter-Detail
                zuordnen.
              </p>
            </div>
          ) : verteilung.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Ergebnis eingeben und „Berechnen" klicken.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gesellschafter</TableHead>
                    <TableHead className="text-right">Effektive Quote</TableHead>
                    <TableHead className="text-right">Anteil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verteilung.map((v) => (
                    <TableRow key={v.gesellschafter_id}>
                      <TableCell className="font-medium">
                        {namen.get(v.gesellschafter_id) ?? v.gesellschafter_id}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(v.effektiv_quote * 100).toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        %
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(v.anteil_betrag)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Summe</TableCell>
                    <TableCell />
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatEUR(summe)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
