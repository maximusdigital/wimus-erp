import Link from "next/link"
import {
  Building2,
  FolderKanban,
  Layers,
  Receipt,
  SlidersHorizontal,
  Tags,
  ScrollText,
  Users,
  ShieldCheck,
} from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Einstellungen" }

type Bereich = {
  title: string
  desc: string
  href: string
  icon: typeof Building2
  aktiv?: boolean
}

const gruppen: { label: string; items: Bereich[] }[] = [
  {
    label: "Organisation",
    items: [
      { title: "Workspace", desc: "Dachorganisation (Org-Ebene 1) & globale CI-Defaults.", href: "/einstellungen/workspace", icon: Layers },
      { title: "Firmen", desc: "Juristische Personen / Gesellschaften (Org-Ebene 2).", href: "/einstellungen/firmen", icon: Building2 },
      { title: "Projekte", desc: "Operative Einheiten & Unterprojekte (Org-Ebene 3) – der Switcher.", href: "/einstellungen/projekte", icon: FolderKanban },
    ],
  },
  {
    label: "Stammdaten & Kataloge",
    items: [
      { title: "BK-Kostenarten", desc: "Betriebskosten-Kostenarten-Katalog (BetrKV, Umlageschlüssel, HKVO).", href: "/einstellungen/bk-arten", icon: Receipt },
      { title: "Datenfelder", desc: "Eigene Custom-Fields je Entität – stabiler Schlüssel, filterbar.", href: "/einstellungen/felder", icon: SlidersHorizontal },
      { title: "Kontakttypen", desc: "Typen für Personen & Organisationen (mehrfach zuweisbar). System-Typen geschützt.", href: "/einstellungen/kontakttypen", icon: Tags },
    ],
  },
  {
    label: "Verwaltung & Sicherheit",
    items: [
      { title: "Benutzer", desc: "Benutzer-Stammdaten & Aktiv-Status verwalten (Rollen ansehen).", href: "/einstellungen/benutzer", icon: Users },
      { title: "Audit-Log", desc: "Technischer, lückenloser Änderungsverlauf kritischer Tabellen (append-only).", href: "/einstellungen/audit", icon: ScrollText },
      { title: "Berechtigungen", desc: "Rollen-Rechte-Matrix & Scopes (Firma/Projekt) – folgt in Stufe 1.", href: "#", icon: ShieldCheck, aktiv: false },
    ],
  },
]

function Kachel({ b }: { b: Bereich }) {
  const inner = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <b.icon className="size-5" />
        </div>
        <CardTitle className="mt-2 flex items-center gap-2">
          {b.title}
          {b.aktiv === false ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              bald
            </span>
          ) : null}
        </CardTitle>
        <CardDescription>{b.desc}</CardDescription>
      </CardHeader>
    </Card>
  )
  return b.aktiv === false ? (
    <div className="cursor-not-allowed opacity-60">{inner}</div>
  ) : (
    <Link href={b.href} className="group">
      {inner}
    </Link>
  )
}

export default function EinstellungenPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">
          Administration: Organisation, Stammdaten-Kataloge, Verwaltung &amp; Sicherheit
        </p>
      </div>

      {gruppen.map((g) => (
        <section key={g.label} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{g.label}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((b) => (
              <Kachel key={b.title} b={b} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
