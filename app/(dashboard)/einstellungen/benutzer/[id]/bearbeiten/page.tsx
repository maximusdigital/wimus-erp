import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { BenutzerForm } from "@/components/einstellungen/benutzer-form"

export const metadata = { title: "Benutzer bearbeiten" }

type BenutzerRow = {
  id: string
  email: string | null
  vorname: string | null
  nachname: string | null
  aktiv: boolean | null
  benutzer_rollen: { rolle_id: string }[] | null
}

export default async function BenutzerBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: userData }, { data: benutzerData }, { data: rollenData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .schema("wimus")
      .from("benutzer")
      .select("id, email, vorname, nachname, aktiv, benutzer_rollen(rolle_id)")
      .eq("id", id)
      .maybeSingle(),
    supabase.schema("wimus").from("rollen").select("id, name"),
  ])

  const benutzer = benutzerData as BenutzerRow | null
  if (!benutzer) notFound()

  const rollenName = new Map((rollenData ?? []).map((r: { id: string; name: string }) => [r.id, r.name]))
  const rollen = (benutzer.benutzer_rollen ?? []).map((br) => rollenName.get(br.rolle_id) ?? "?")
  const anzeigeName = [benutzer.vorname, benutzer.nachname].filter(Boolean).join(" ") || benutzer.email || "Benutzer"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen/benutzer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Benutzer
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{anzeigeName}</h1>
        <p className="text-sm text-muted-foreground">Stammdaten &amp; Aktiv-Status</p>
      </div>

      <BenutzerForm
        benutzer={{
          id: benutzer.id,
          email: benutzer.email,
          vorname: benutzer.vorname,
          nachname: benutzer.nachname,
          aktiv: benutzer.aktiv,
        }}
        rollen={rollen}
        istSelbst={userData?.user?.id === benutzer.id}
      />
    </div>
  )
}
