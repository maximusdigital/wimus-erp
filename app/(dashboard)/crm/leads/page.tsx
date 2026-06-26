import Link from "next/link"
import { Plus, Inbox } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { LeadListe } from "@/components/crm/lead-liste"
import type { FirmaRef, Lead, Pipeline, PipelineStage } from "@/types/crm"

export const metadata = { title: "CRM – Lead-Inbox" }

type LeadMitBezug = Lead & {
  kontakt?: { id: string; vorname: string | null; nachname: string | null } | null
  organisation?: { id: string; name: string } | null
}
type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

export default async function LeadInboxPage() {
  const supabase = await createServerClient()

  const [{ data: leadsRaw }, { data: firmenRaw }, { data: pipelinesRaw }] = await Promise.all([
    supabase
      .from("crm_leads")
      .select(
        "*, kontakt:kontakte(id, vorname, nachname), organisation:organisationen(id, name)"
      )
      .in("status", ["neu", "qualifiziert"])
      .order("created_at", { ascending: false }),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
    supabase
      .from("crm_pipelines")
      .select("*, stages:crm_pipeline_stages(*)")
      .eq("aktiv", true)
      .order("sortierung"),
  ])

  const leads = (leadsRaw ?? []) as LeadMitBezug[]
  const firmen = (firmenRaw ?? []) as FirmaRef[]
  const pipelines = (pipelinesRaw ?? []) as PipelineMitStages[]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Lead-Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} offene {leads.length === 1 ? "Anfrage" : "Anfragen"} · Triage:
            qualifizieren oder verwerfen
          </p>
        </div>
        <Button render={<Link href="/crm/leads/neu" />}>
          <Plus /> <span>Lead erfassen</span>
        </Button>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <p className="font-medium">Inbox leer</p>
          <p className="text-sm text-muted-foreground">Keine offenen Leads zur Triage.</p>
        </div>
      ) : (
        <LeadListe leads={leads} firmen={firmen} pipelines={pipelines} />
      )}
    </div>
  )
}
