import { createServerClient } from "@/lib/supabase/server"
import { PrintLayout } from "@/components/layouts/print-layout"
import { ReportKopf, ReportFuss } from "@/components/fibu/report-kopf"
import {
  konsolidiereGuV,
  konsolidiereNachPosition,
  type FirmaBuchungen,
  type KonsoSpalte,
} from "@/lib/fibu/konsolidierung"
import type { GuvBuchung } from "@/lib/fibu/guv"
import type { TaxonomiePosition } from "@/lib/fibu/taxonomie"
import { formatEUR } from "@/lib/utils/format"

export const metadata = { title: "Konsolidierung-Druck" }

type Sp = { f?: string | string[]; von?: string; bis?: string; modus?: string }
type MatrixZeile = { id: string; label: string; werte: Record<string, number>; summe: number }

export default async function KonsoDruckPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams
  const supabase = await createServerClient()
  const jahr = new Date().getFullYear()
  const von = (typeof sp.von === "string" && sp.von) || `${jahr}-01-01`
  const bis = (typeof sp.bis === "string" && sp.bis) || `${jahr}-12-31`
  const sel = Array.isArray(sp.f) ? sp.f : sp.f ? [sp.f] : []

  const [{ data: firmenRaw }, { data: taxRaw }] = await Promise.all([
    supabase.from("firmen").select("id, name, kuerzel"),
    supabase.from("reporting_taxonomie").select("position_code, bezeichnung, mapping"),
  ])
  const firmen = (firmenRaw ?? []) as { id: string; name: string; kuerzel: string | null }[]
  const positionen = (taxRaw ?? []) as TaxonomiePosition[]
  const modus = sp.modus === "positionen" && positionen.length > 0 ? "positionen" : "konten"

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
    for (const b of (data ?? []) as (GuvBuchung & { firma_id: string })[]) byFirma.get(b.firma_id)?.push(b)
    for (const id of sel) {
      firmenBuchungen.push({
        firmaId: id,
        firmaName: firmen.find((f) => f.id === id)?.kuerzel || firmen.find((f) => f.id === id)?.name || id,
        buchungen: byFirma.get(id) ?? [],
      })
    }
  }

  let spalten: KonsoSpalte[]
  let ertrag: MatrixZeile[]
  let aufwand: MatrixZeile[]
  let ergebnis: number

  if (modus === "positionen") {
    const kp = konsolidiereNachPosition(firmenBuchungen, positionen)
    spalten = kp.spalten
    ergebnis = kp.ergebnis
    ertrag = kp.ertraege.map((z) => ({ id: z.position_code, label: z.bezeichnung, werte: z.werte, summe: z.summe }))
    aufwand = kp.aufwendungen.map((z) => ({ id: z.position_code, label: z.bezeichnung, werte: z.werte, summe: z.summe }))
  } else {
    const k = konsolidiereGuV(firmenBuchungen)
    spalten = k.spalten
    ergebnis = k.ergebnis
    ertrag = k.ertraege.map((z) => ({ id: z.konto, label: z.konto, werte: z.werte, summe: z.summe }))
    aufwand = k.aufwendungen.map((z) => ({ id: z.konto, label: z.konto, werte: z.werte, summe: z.summe }))
  }

  const erste = modus === "positionen" ? "Position" : "Konto"

  return (
    <PrintLayout title="Konsolidierte GuV (Druck)">
      <ReportKopf
        titel="Konsolidierte GuV"
        untertitel={`${spalten.map((s) => s.firmaName).join(", ") || "—"} · ${von} – ${bis}${modus === "positionen" ? " · Berichtspositionen" : ""}`}
      />
      <Matrix titel="Erträge" erste={erste} zeilen={ertrag} spalten={spalten} summeKey="summe_ertrag" />
      <div className="h-4" />
      <Matrix titel="Aufwendungen" erste={erste} zeilen={aufwand} spalten={spalten} summeKey="summe_aufwand" />
      <div className="mt-6 flex items-center justify-between border-t-2 border-primary pt-3">
        <span className="text-base font-semibold">Konsolidiertes Ergebnis</span>
        <span className={`text-lg font-bold tabular-nums ${ergebnis < 0 ? "text-danger" : "text-success"}`}>
          {formatEUR(ergebnis)}
        </span>
      </div>
      <ReportFuss hinweis="SKR03-Heuristik (4xxx Aufwand / 8xxx Ertrag). Summen je Einheit + konsolidiert; ohne Innenumsatz-Eliminierung." />
    </PrintLayout>
  )
}

function Matrix({
  titel,
  erste,
  zeilen,
  spalten,
  summeKey,
}: {
  titel: string
  erste: string
  zeilen: MatrixZeile[]
  spalten: KonsoSpalte[]
  summeKey: "summe_ertrag" | "summe_aufwand"
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-primary">{titel}</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#ccc] text-left">
            <th className="py-1">{erste}</th>
            {spalten.map((s) => (
              <th key={s.firmaId} className="py-1 text-right">{s.firmaName}</th>
            ))}
            <th className="py-1 text-right">Summe</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((z) => (
            <tr key={z.id} className="border-b border-[#eee]">
              <td className="py-1">{z.label}</td>
              {spalten.map((s) => (
                <td key={s.firmaId} className="py-1 text-right tabular-nums">
                  {z.werte[s.firmaId] ? formatEUR(z.werte[s.firmaId]) : "–"}
                </td>
              ))}
              <td className="py-1 text-right font-medium tabular-nums">{formatEUR(z.summe)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#ccc] font-semibold">
            <td className="py-1">Summe</td>
            {spalten.map((s) => (
              <td key={s.firmaId} className="py-1 text-right tabular-nums">{formatEUR(s[summeKey])}</td>
            ))}
            <td className="py-1 text-right tabular-nums">
              {formatEUR(spalten.reduce((acc, s) => acc + s[summeKey], 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
