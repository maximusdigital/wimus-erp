import { createServerClient } from "@/lib/supabase/server"
import { PipelineVerwaltung } from "@/components/crm/pipeline-verwaltung"
import type { Pipeline, PipelineStage, VerlorenGrund } from "@/types/crm"

export const metadata = { title: "CRM – Pipelines" }

type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

export default async function PipelinesPage() {
  const supabase = await createServerClient()

  const [{ data: pipelines }, { data: gruende }] = await Promise.all([
    supabase
      .from("crm_pipelines")
      .select("*, stages:crm_pipeline_stages(*)")
      .order("sortierung"),
    supabase.from("crm_verloren_gruende").select("*").order("sortierung"),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pipelines &amp; Stages</h1>
        <p className="text-sm text-muted-foreground">
          Vertriebsprozesse je Marke konfigurieren – inkl. Verloren-Gründe.
        </p>
      </div>
      <PipelineVerwaltung
        pipelines={(pipelines ?? []) as PipelineMitStages[]}
        gruende={(gruende ?? []) as VerlorenGrund[]}
      />
    </div>
  )
}
