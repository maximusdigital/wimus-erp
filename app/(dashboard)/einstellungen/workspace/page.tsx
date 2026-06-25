import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { getWorkspace } from "@/lib/firmen"
import { WorkspaceForm } from "@/components/einstellungen/workspace-form"

export const metadata = { title: "Workspace – Einstellungen" }

export default async function WorkspacePage() {
  const workspace = await getWorkspace()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/einstellungen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Einstellungen
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Dachorganisation (Org-Ebene 1) & globale CI-Defaults
        </p>
      </div>
      {workspace ? (
        <WorkspaceForm workspace={workspace} />
      ) : (
        <p className="text-sm text-muted-foreground">Kein Workspace gefunden.</p>
      )}
    </div>
  )
}
