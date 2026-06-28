import { createServerClient } from "@/lib/supabase/server"
import { getFeed } from "@/lib/historie/feed"
import { Timeline } from "@/components/historie/timeline"

export const metadata = { title: "Historie" }

export default async function HistoriePage() {
  const supabase = await createServerClient()
  const aktivitaeten = await getFeed(supabase, { limit: 100 })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Historie</h1>
        <p className="text-sm text-muted-foreground">
          Fachlicher Aktivitäts-Zeitstrahl über alle Module – neueste zuerst.
        </p>
      </div>
      <Timeline aktivitaeten={aktivitaeten} />
    </div>
  )
}
