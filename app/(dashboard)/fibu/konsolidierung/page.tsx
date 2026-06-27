import Link from "next/link"
import { Printer } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { KonsoScopeLeiste } from "@/components/fibu/konso-scope"
import { konsolidiereGuV, type FirmaBuchungen, type KonsoZeile } from "@/lib/fibu/konsolidierung"
import type { GuvBuchung } from "@/lib/fibu/guv"
import { formatEUR } from "@/lib/utils/format"

export const metadata = { title: "Konsolidierte GuV" }

const inputCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

type FirmaRow = { id: string; name: string; kuerzel: string | null }
type Scope = { id: string; name: string; einheiten_set: string[] }
type Sp = { f?: string | string[]; von?: string; bis?: string }

export default async function KonsolidierungPage({
  searchParams,
}: {
  searchParams: Promise<Sp>
}) {
  const sp = await searchParams
  const supabase = await createServerClient()
  const jahr = new Date().getFullYear()
  const von = (typeof sp.von === "string" && sp.von) || `${jahr}-01-01`
  const bis = (typeof sp.bis === "string" && sp.bis) || `${jahr}-12-31`
  const sel = Array.isArray(sp.f) ? sp.f : sp.f ? [sp.f] : []

  const [{ data: firmenRaw }, { data: scopesRaw }] = await Promise.all([
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
    supabase.from("auswertungs_scopes").select("id, name, einheiten_set").order("name"),
  ])
  const firmen = (firmenRaw ?? []) as FirmaRow[]
  const scopes = (scopesRaw ?? []) as Scope[]

  const firmenBuchungen: FirmaBuchungen[] = []
  if (sel.length > 0) {
    const { data } = await supabase
      .from("fibu_buchungen")
      .select("firma_id, soll_konto, haben_konto, betrag_brutto")
      .gte("datum", von)
      .lte("datum", bis)
      .in("firma_id", sel)
    const byFirma = new Map<string, GuvBuchung[]>()
    sel.forEach((id) => byFirma.set(id, []))
    for (const b of (data ?? []) as (GuvBuchung & { firma_id: string })[]) {
      byFirma.get(b.firma_id)?.push(b)
    }
    for (const id of sel) {
      firmenBuchungen.push({
        firmaId: id,
        firmaName: firmen.find((f) => f.id === id)?.kuerzel || firmen.find((f) => f.id === id)?.name || id,
        buchungen: byFirma.get(id) ?? [],
      })
    }
  }

  const konso = konsolidiereGuV(firmenBuchungen)
  const druckHref = `/fibu/konsolidierung/druck?${sel.map((id) => `f=${id}`).join("&")}&von=${von}&bis=${bis}`

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Konsolidierte GuV</h1>
          <p className="text-muted-foreground text-sm">
            Mehrere Einheiten zusammenfassen · {von} bis {bis} · Controlling-Sicht
          </p>
        </div>
        {sel.length > 0 ? (
          <Button variant="outline" render={<Link href={druckHref} />}>
            <Printer />
            <span>A4-Druck / PDF</span>
          </Button>
        ) : null}
      </div>

      {/* Scope-Selektor */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Scope</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form method="get" className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {firmen.map((f) => (
                <label key={f.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <input type="checkbox" name="f" value={f.id} defaultChecked={sel.includes(f.id)} />
                  <span className="truncate">{f.name}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="von">Von</label>
                <input id="von" name="von" type="date" defaultValue={von} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="bis">Bis</label>
                <input id="bis" name="bis" type="date" defaultValue={bis} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Konsolidieren</Button>
              </div>
            </div>
          </form>

          <KonsoScopeLeiste scopes={scopes} selektion={sel} von={von} bis={bis} />
        </CardContent>
      </Card>

      {sel.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Wähle mindestens eine Einheit und klicke „Konsolidieren".
        </p>
      ) : (
        <>
          <MatrixCard
            titel="Erträge"
            zeilen={konso.ertraege}
            spalten={konso.spalten}
            summeKey="summe_ertrag"
          />
          <MatrixCard
            titel="Aufwendungen"
            zeilen={konso.aufwendungen}
            spalten={konso.spalten}
            summeKey="summe_aufwand"
          />
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-medium">Konsolidiertes Ergebnis</span>
              <span
                className={`text-lg font-semibold tabular-nums ${konso.ergebnis < 0 ? "text-danger" : "text-success"}`}
              >
                {formatEUR(konso.ergebnis)}
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function MatrixCard({
  titel,
  zeilen,
  spalten,
  summeKey,
}: {
  titel: string
  zeilen: KonsoZeile[]
  spalten: { firmaId: string; firmaName: string; summe_ertrag: number; summe_aufwand: number }[]
  summeKey: "summe_ertrag" | "summe_aufwand"
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Konto</TableHead>
                {spalten.map((s) => (
                  <TableHead key={s.firmaId} className="text-right">{s.firmaName}</TableHead>
                ))}
                <TableHead className="text-right font-semibold">Summe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zeilen.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={spalten.length + 2} className="py-4 text-center text-muted-foreground">
                    Keine Buchungen
                  </TableCell>
                </TableRow>
              ) : (
                zeilen.map((z) => (
                  <TableRow key={z.konto}>
                    <TableCell className="tabular-nums">{z.konto}</TableCell>
                    {spalten.map((s) => (
                      <TableCell key={s.firmaId} className="text-right tabular-nums">
                        {z.werte[s.firmaId] ? formatEUR(z.werte[s.firmaId]) : "–"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium tabular-nums">{formatEUR(z.summe)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Summe {titel}</TableCell>
                {spalten.map((s) => (
                  <TableCell key={s.firmaId} className="text-right font-semibold tabular-nums">
                    {formatEUR(s[summeKey])}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatEUR(spalten.reduce((acc, s) => acc + s[summeKey], 0))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
