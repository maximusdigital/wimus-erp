import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { formatEUR, formatDate } from "@/lib/utils/format"
import { tageInStage } from "@/lib/crm/stage"
import { erwarteterWert, detailFelder } from "@/lib/crm/deal"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DealAbschluss } from "@/components/crm/deal-abschluss"
import { DealAktivitaeten } from "@/components/crm/deal-aktivitaeten"
import type {
  CustomFieldDefinition,
  DealAktivitaet,
  DealMitBezug,
  DealStageHistorie,
  PipelineStage,
  VerlorenGrund,
} from "@/types/crm"

export const metadata = { title: "Deal" }

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: dealRaw } = await supabase
    .from("crm_deals")
    .select(
      "*, kontakt:kontakte(id, vorname, nachname), organisation:organisationen(id, name), firma:firmen(id, name, kuerzel), stage:crm_pipeline_stages(id, name, ist_gewonnen, ist_verloren, stalled_tage)"
    )
    .eq("id", id)
    .maybeSingle()

  if (!dealRaw) notFound()
  const deal = dealRaw as DealMitBezug

  const [{ data: stagesRaw }, { data: histoRaw }, { data: aktRaw }, { data: gruendeRaw }, { data: cfsRaw }] =
    await Promise.all([
      supabase
        .from("crm_pipeline_stages")
        .select("*")
        .eq("pipeline_id", deal.pipeline_id)
        .order("sortierung"),
      supabase
        .from("crm_deal_stage_historie")
        .select("*")
        .eq("deal_id", id)
        .order("am", { ascending: false }),
      supabase
        .from("crm_deal_aktivitaeten")
        .select("*")
        .eq("deal_id", id)
        .order("faellig_am", { ascending: true, nullsFirst: false }),
      supabase.from("crm_verloren_gruende").select("*").eq("aktiv", true).order("sortierung"),
      supabase
        .from("crm_custom_field_definitionen")
        .select("*")
        .eq("entitaet", "deal"),
    ])

  const stages = (stagesRaw ?? []) as PipelineStage[]
  const historie = (histoRaw ?? []) as DealStageHistorie[]
  const aktivitaeten = (aktRaw ?? []) as DealAktivitaet[]
  const gruende = (gruendeRaw ?? []) as VerlorenGrund[]
  const cfs = (cfsRaw ?? []) as CustomFieldDefinition[]

  const aktStage = stages.find((s) => s.id === deal.stage_id)
  const wahrsch = aktStage?.wahrscheinlichkeit ?? 0
  const tage = tageInStage(deal.in_stage_seit, new Date())
  const detailCustom = detailFelder(cfs, { entitaet: "deal", pipelineId: deal.pipeline_id })

  const kontaktName = deal.kontakt
    ? [deal.kontakt.vorname, deal.kontakt.nachname].filter(Boolean).join(" ")
    : null

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button render={<Link href="/crm" />} size="icon" variant="ghost" aria-label="Zurück">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{deal.titel}</h1>
            <p className="text-sm text-muted-foreground">
              {deal.firma?.name ?? "—"} · {aktStage?.name ?? "—"}
            </p>
          </div>
        </div>
        <DealAbschluss dealId={deal.id} status={deal.status} verlorenGruende={gruende} />
      </div>

      {/* Stage-Fortschrittsbalken */}
      <div className="flex flex-wrap gap-1">
        {stages.map((s) => {
          const aktiv = s.id === deal.stage_id
          const passiert = s.sortierung < (aktStage?.sortierung ?? -1)
          return (
            <div
              key={s.id}
              className={cn(
                "flex-1 rounded px-2 py-1.5 text-center text-xs font-medium",
                aktiv
                  ? "bg-success text-white"
                  : passiert
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {s.name}
              {aktiv ? <span className="block text-[0.65rem] font-normal">{tage} Tage</span> : null}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Linke Spalte: Zusammenfassung */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-sm font-semibold">Zusammenfassung</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Wert">{formatEUR(deal.wert)}</Row>
              <Row label="Gewichtet">
                {formatEUR(erwarteterWert(deal.wert, wahrsch))} ({wahrsch}%)
              </Row>
              <Row label="Abschluss">{formatDate(deal.erwartetes_abschluss_datum)}</Row>
              <Row label="Kontakt">{kontaktName ?? "—"}</Row>
              <Row label="Organisation">{deal.organisation?.name ?? "—"}</Row>
            </dl>
          </div>

          {detailCustom.length > 0 ? (
            <div className="rounded-lg border p-4">
              <h2 className="mb-3 text-sm font-semibold">Weitere Felder</h2>
              <dl className="flex flex-col gap-2 text-sm">
                {detailCustom.map((f) => (
                  <Row key={f.id} label={f.name}>
                    {formatCustom(deal.custom_values?.[f.id])}
                  </Row>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        {/* Rechte Spalte: Aktivitäten + Timeline */}
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold">Aktivitäten</h2>
            <DealAktivitaeten dealId={deal.id} aktivitaeten={aktivitaeten} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Verlauf</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {historie.length === 0 ? (
                <li className="text-muted-foreground">Noch keine Stage-Wechsel.</li>
              ) : (
                historie.map((h) => {
                  const von = stages.find((s) => s.id === h.von_stage_id)?.name ?? "Start"
                  const nach = stages.find((s) => s.id === h.nach_stage_id)?.name ?? "—"
                  return (
                    <li key={h.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatDate(h.am)}</span>
                      <span>
                        {von} → {nach}
                      </span>
                      {h.verweildauer_tage != null ? (
                        <span className="text-xs text-muted-foreground">
                          ({h.verweildauer_tage} Tage)
                        </span>
                      ) : null}
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

function formatCustom(v: unknown): string {
  if (v == null || v === "") return "—"
  if (typeof v === "boolean") return v ? "Ja" : "Nein"
  if (Array.isArray(v)) return v.join(", ")
  return String(v)
}
