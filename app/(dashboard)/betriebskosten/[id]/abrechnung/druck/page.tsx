import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/server"
import { ladeAbrechnungslauf, zeileLabel } from "@/lib/betriebskosten-run"
import { PrintLayout } from "@/components/layouts/print-layout"
import { formatEUR } from "@/lib/utils/format"
import { BK_SCHLUESSEL_LABELS } from "@/types/bk-art"

export const metadata = { title: "Nebenkostenspiegel" }

export default async function AbrechnungDruckPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id } = await params
  const { period } = await searchParams
  const supabase = await createServerClient()
  const lauf = await ladeAbrechnungslauf(supabase, id, period)
  if (!lauf) notFound()

  const { ae, ergebnis, mitgliedById, positionen, standardSchluessel } = lauf
  // bk_art_id → Bezeichnung
  const artLabel = new Map<string, string>()
  for (const p of positionen) {
    if (p.bk_art_id && p.bk_art?.bezeichnung) artLabel.set(p.bk_art_id, p.bk_art.bezeichnung)
  }

  return (
    <PrintLayout title="Nebenkostenspiegel">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Betriebskostenabrechnung</h1>
        <p className="mt-1 text-base">
          {ae.objekt?.kuerzel ?? "Objekt"}
          {ae.objekt?.stadt ? ` · ${ae.objekt.stadt}` : ""}
        </p>
        <p className="text-sm text-[#555]">
          Abrechnungseinheit: {ae.bezeichnung} · Umlageschlüssel:{" "}
          {BK_SCHLUESSEL_LABELS[standardSchluessel] ?? standardSchluessel}
          {period ? ` · Abrechnungsperiode ${period}` : ""}
        </p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[#555]">Kosten gesamt</p>
          <p className="text-lg font-bold tabular-nums">{formatEUR(ergebnis.kostenGesamt)}</p>
        </div>
        <div>
          <p className="text-xs text-[#555]">Vorauszahlungen</p>
          <p className="text-lg font-bold tabular-nums">{formatEUR(ergebnis.vorauszahlungGesamt)}</p>
        </div>
        <div>
          <p className="text-xs text-[#555]">Saldo gesamt</p>
          <p className="text-lg font-bold tabular-nums">
            {formatEUR(ergebnis.vorauszahlungGesamt - ergebnis.kostenGesamt)}
          </p>
        </div>
      </div>

      {ergebnis.zeilen.map((z) => (
        <section key={z.id} className="mb-6 break-inside-avoid">
          <h2 className="mb-1 border-b border-[#ddd] pb-1 text-base font-semibold">
            {zeileLabel(mitgliedById.get(z.id), z.id)}
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {z.positionen.map((p, i) => (
                <tr key={i} className="border-b border-[#eee]">
                  <td className="py-1">{artLabel.get(p.bk_art_id) ?? p.bk_art_id}</td>
                  <td className="py-1 text-right tabular-nums">{formatEUR(p.betrag)}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-1">Kostenanteil gesamt</td>
                <td className="py-1 text-right tabular-nums">{formatEUR(z.kostenAnteil)}</td>
              </tr>
              <tr>
                <td className="py-1">abzgl. Vorauszahlungen</td>
                <td className="py-1 text-right tabular-nums">− {formatEUR(z.vorauszahlung)}</td>
              </tr>
              <tr className="border-t-2 border-[#333] font-bold">
                <td className="py-1">
                  {z.saldo > 0 ? "Guthaben" : z.saldo < 0 ? "Nachzahlung" : "Saldo"}
                </td>
                <td className="py-1 text-right tabular-nums">{formatEUR(z.saldo)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      ))}

      <footer className="mt-8 border-t pt-3 text-xs text-[#777]">
        Erstellt mit WIMUS ERP · Diese Abrechnung ist eine Vorschau/Entwurf nach §556 BGB.
      </footer>
    </PrintLayout>
  )
}
