import Link from "next/link"
import { Building2, FolderKanban, Layers, Receipt } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Einstellungen" }

const bereiche = [
  {
    title: "Projekte",
    desc: "Teilbereiche & Unterprojekte (Org-Ebene 3) verwalten – der Mandanten-Switcher.",
    href: "/einstellungen/projekte",
    icon: FolderKanban,
    aktiv: true,
  },
  {
    title: "Firmen",
    desc: "Tochterunternehmen / Gesellschaften (Org-Ebene 2).",
    href: "/einstellungen/firmen",
    icon: Building2,
    aktiv: true,
  },
  {
    title: "Workspace",
    desc: "Dachorganisation (Org-Ebene 1) & globale CI-Defaults.",
    href: "/einstellungen/workspace",
    icon: Layers,
    aktiv: true,
  },
  {
    title: "BK-Kostenarten",
    desc: "Betriebskosten-Kostenarten-Katalog (BetrKV, Umlageschlüssel, HKVO).",
    href: "/einstellungen/bk-arten",
    icon: Receipt,
    aktiv: true,
  },
]

export default function EinstellungenPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">
          Organisations-Hierarchie: Workspace → Firma → Projekt
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bereiche.map((b) => {
          const inner = (
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="size-5" />
                </div>
                <CardTitle className="mt-2 flex items-center gap-2">
                  {b.title}
                  {!b.aktiv ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      bald
                    </span>
                  ) : null}
                </CardTitle>
                <CardDescription>{b.desc}</CardDescription>
              </CardHeader>
            </Card>
          )
          return b.aktiv ? (
            <Link key={b.title} href={b.href} className="group">
              {inner}
            </Link>
          ) : (
            <div key={b.title} className="cursor-not-allowed opacity-60">
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
