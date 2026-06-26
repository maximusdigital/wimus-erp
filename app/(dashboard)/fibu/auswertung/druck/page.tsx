import { createServerClient } from "@/lib/supabase/server"
import { PrintLayout } from "@/components/layouts/print-layout"
import { ReportKopf, ReportFuss } from "@/components/fibu/report-kopf"
import { aggregateGuV, type GuvBuchung } from "@/lib/fibu/guv"
import { formatEUR } from "@/lib/utils/format"

export const metadata = { title: "GuV-Druck" }

type Such = { firma_id?: string; von?: string; bis?: string }

export default async function GuvDruckPage({
  searchParams,
}: {
  searchParams: Promise<Such>
}) {
  const sp = await searchParams
  const supabase = await createServerClient()
  const jahr = new Date().getFullYear()
  const von = sp.von || `${jahr}-01-01`
  const bis = sp.bis || `${jahr}-12-31`
  const firmaId = sp.firma_id || ""

  const { data: firmen } = await supabase.from("firmen").select("id, name").order("name")
  const firmaName =
    firmaId ? (firmen ?? []).find((f) => f.id === firmaId)?.name ?? "—" : "Alle Firmen"

  let query = supabase
    .from("fibu_buchungen")
    .select("soll_konto, haben_konto, betrag_brutto")
    .gte("datum", von)
    .lte("datum", bis)
  if (firmaId) query = query.eq("firma_id", firmaId)
  const { data } = await query

  const guv = aggregateGuV((data ?? []) as GuvBuchung[])

  return (
    <PrintLayout title="GuV-Kurzform (Druck)">
      <ReportKopf
        titel="GuV-Kurzform"
        untertitel={`${firmaName} · ${von} – ${bis}`}
        mandant={firmaName}
      />

      <div className="grid grid-cols-2 gap-8">
        <Block titel="Erträge" zeilen={guv.ertraege} summe={guv.summe_ertrag} />
        <Block titel="Aufwendungen" zeilen={guv.aufwendungen} summe={guv.summe_aufwand} />
      </div>

      <div className="mt-6 flex items-center justify-between border-t-2 border-primary pt-3">
        <span className="text-base font-semibold">Ergebnis (Erträge − Aufwendungen)</span>
        <span
          className={`text-lg font-bold tabular-nums ${guv.ergebnis < 0 ? "text-danger" : "text-success"}`}
        >
          {formatEUR(guv.ergebnis)}
        </span>
      </div>

      <ReportFuss hinweis="SKR03-Heuristik (4xxx Aufwand / 8xxx Ertrag). Bemessung aus fibu_buchungen im gewählten Zeitraum." />
    </PrintLayout>
  )
}

function Block({
  titel,
  zeilen,
  summe,
}: {
  titel: string
  zeilen: { konto: string; betrag: number }[]
  summe: number
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-primary">{titel}</h2>
      {zeilen.length === 0 ? (
        <p className="text-xs text-[#666]">Keine Buchungen im Zeitraum.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.konto} className="border-b border-[#eee]">
                <td className="py-1 tabular-nums">{z.konto}</td>
                <td className="py-1 text-right tabular-nums">{formatEUR(z.betrag)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#ccc] font-semibold">
              <td className="py-1">Summe</td>
              <td className="py-1 text-right tabular-nums">{formatEUR(summe)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
