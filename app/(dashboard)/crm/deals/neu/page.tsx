import { createServerClient } from "@/lib/supabase/server"
import { DealForm } from "@/components/crm/deal-form"
import type {
  CustomFieldDefinition,
  FirmaRef,
  KontaktRef,
  OrganisationRef,
  Pipeline,
  PipelineStage,
} from "@/types/crm"

export const metadata = { title: "Neuer Deal" }

type PipelineMitStages = Pipeline & { stages: PipelineStage[] }

export default async function NeuerDealPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>
}) {
  const { pipeline } = await searchParams
  const supabase = await createServerClient()

  const [{ data: firmen }, { data: pipelines }, { data: kontakte }, { data: orgs }, { data: cfs }] =
    await Promise.all([
      supabase.from("firmen").select("id, name, kuerzel").order("name"),
      supabase
        .from("crm_pipelines")
        .select("*, stages:crm_pipeline_stages(*)")
        .eq("aktiv", true)
        .order("sortierung"),
      supabase.from("kontakte").select("id, vorname, nachname").order("nachname").limit(500),
      supabase.from("organisationen").select("id, name").order("name").limit(500),
      supabase.from("crm_custom_field_definitionen").select("*").eq("entitaet", "deal"),
    ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Neuer Deal</h1>
        <p className="text-sm text-muted-foreground">
          Mandant/Einheit (INNEN) ist Pflicht, Kontakt/Organisation (AUSSEN) optional.
        </p>
      </div>
      <DealForm
        firmen={(firmen ?? []) as FirmaRef[]}
        pipelines={(pipelines ?? []) as PipelineMitStages[]}
        kontakte={(kontakte ?? []) as KontaktRef[]}
        organisationen={(orgs ?? []) as OrganisationRef[]}
        customFields={(cfs ?? []) as CustomFieldDefinition[]}
        pipelineVorauswahl={pipeline}
      />
    </div>
  )
}
