import Link from "next/link"
import {
  Building2,
  DoorOpen,
  FileText,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { DEMO_OBJEKTE } from "@/lib/dev/demo-objekte"
import { DEMO_EINHEITEN } from "@/lib/dev/demo-einheiten"
import { DEMO_KONTAKTE } from "@/lib/dev/demo-kontakte"
import { DEMO_VERTRAEGE } from "@/lib/dev/demo-vertraege"
import { isPreviewNoAuth } from "@/lib/dev/preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { KpiCard } from "@/components/ui/kpi-card"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  VERTRAGSTYP_LABELS,
  VERTRAG_STATUS_LABELS,
  warmmiete,
  type VertragMitRelationen,
} from "@/types/vertrag"

export const metadata = {
  title: "Dashboard",
}

const VERTRAG_SELECT =
  "*, einheit:einheiten(verwendungszweck_code, bezeichnung, objekt:objekte(kuerzel)), mieter:kontakte(vorname, nachname, firmenname)"

type Kpi = {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  href: string
}

async function ladeDashboardDaten() {
  const supabase = await createServerClient()

  const [objekteRes, einheitenRes, kontakteRes, vertraegeRes, aktivRes, letzteRes] =
    await Promise.all([
      supabase.from("objekte").select("*", { count: "exact", head: true }),
      supabase.from("einheiten").select("*", { count: "exact", head: true }),
      supabase.from("kontakte").select("*", { count: "exact", head: true }),
      supabase
        .schema("wimus")
        .from("mietvertraege")
        .select("*", { count: "exact", head: true }),
      supabase
        .schema("wimus")
        .from("mietvertraege")
        .select("*", { count: "exact", head: true })
        .eq("status", "aktiv"),
      supabase
        .schema("wimus")
        .from("mietvertraege")
        .select(VERTRAG_SELECT)
        .order("mietbeginn", { nullsFirst: false })
        .limit(5),
    ])

  let objekteCount = objekteRes.count ?? 0
  let einheitenCount = einheitenRes.count ?? 0
  let kontakteCount = kontakteRes.count ?? 0
  let vertraegeCount = vertraegeRes.count ?? 0
  let aktivCount = aktivRes.count ?? 0
  let letzteVertraege = (letzteRes.data ?? []) as unknown as VertragMitRelationen[]

  // Vorschau/Demo: Kennzahlen aus Demo-Daten, damit das Dashboard ohne DB lebt.
  if (isPreviewNoAuth() && objekteCount === 0 && vertraegeCount === 0) {
    objekteCount = DEMO_OBJEKTE.length
    einheitenCount = DEMO_EINHEITEN.length
    kontakteCount = DEMO_KONTAKTE.length
    vertraegeCount = DEMO_VERTRAEGE.length
    aktivCount = DEMO_VERTRAEGE.filter((v) => v.status === "aktiv").length
    letzteVertraege = DEMO_VERTRAEGE
  }

  // Sollmiete/Monat aus den aktiven (geladenen) Verträgen.
  const sollmiete = letzteVertraege
    .filter((v) => v.status === "aktiv")
    .reduce((sum, v) => sum + (warmmiete(v) ?? 0), 0)

  return {
    objekteCount,
    einheitenCount,
    kontakteCount,
    vertraegeCount,
    aktivCount,
    letzteVertraege,
    sollmiete,
  }
}

export default async function DashboardPage() {
  const {
    objekteCount,
    einheitenCount,
    kontakteCount,
    vertraegeCount,
    aktivCount,
    letzteVertraege,
    sollmiete,
  } = await ladeDashboardDaten()

  const kpis: Kpi[] = [
    {
      label: "Objekte",
      value: objekteCount,
      hint: `${einheitenCount} Einheiten gesamt`,
      icon: Building2,
      href: "/objekte",
    },
    {
      label: "Einheiten",
      value: einheitenCount,
      hint: "Wohnungen, Zimmer & Gewerbe",
      icon: DoorOpen,
      href: "/einheiten",
    },
    {
      label: "Kontakte",
      value: kontakteCount,
      hint: "Mieter, Eigentümer & Dienstleister",
      icon: Users,
      href: "/kontakte",
    },
    {
      label: "Verträge",
      value: vertraegeCount,
      hint: `${aktivCount} aktiv`,
      icon: FileText,
      href: "/vertraege",
    },
  ]

  const schnellzugriff = [
    { title: "Neues Objekt", href: "/objekte/neu", icon: Building2 },
    { title: "Neue Einheit", href: "/einheiten/neu", icon: DoorOpen },
    { title: "Neuer Kontakt", href: "/kontakte/neu", icon: Users },
    { title: "Neuer Vertrag", href: "/vertraege/neu", icon: FileText },
  ]

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Überblick über den Stammdatenbestand – Stand{" "}
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="group">
            <KpiCard
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              icon={kpi.icon}
              className="h-full transition-shadow group-hover:shadow-md"
            />
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="grid gap-1">
              <CardTitle>Letzte Verträge</CardTitle>
              <CardDescription>
                {sollmiete > 0
                  ? `Sollmiete (warm) der angezeigten aktiven Verträge: ${formatEUR(
                      sollmiete
                    )}/Monat`
                  : "Zuletzt angelegte Mietverträge"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/vertraege" />}>
              Alle anzeigen
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col">
            {letzteVertraege.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileText className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Noch keine Verträge erfasst.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/vertraege/neu" />}
                >
                  <Plus />
                  <span>Vertrag anlegen</span>
                </Button>
              </div>
            ) : (
              letzteVertraege.map((v, index) => (
                <Link
                  key={v.id}
                  href={`/vertraege/${v.id}`}
                  className={`flex items-center gap-3 py-3 transition-colors hover:bg-muted/40 ${
                    index !== letzteVertraege.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileText className="size-4.5" />
                  </div>
                  <div className="grid flex-1 gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {v.mieter ? kontaktName(v.mieter) : "Ohne Mieter"}
                      </p>
                      <span className="shrink-0 tabular-nums text-sm font-medium">
                        {formatEUR(warmmiete(v))}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {v.einheit?.objekt?.kuerzel ?? "–"}
                      {v.einheit?.verwendungszweck_code
                        ? ` · ${v.einheit.verwendungszweck_code}`
                        : ""}
                      {v.mietbeginn ? ` · ab ${formatDate(v.mietbeginn)}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {v.vertragstyp ? (
                        <Badge variant="secondary" className="text-[0.7rem]">
                          {VERTRAGSTYP_LABELS[v.vertragstyp] ?? v.vertragstyp}
                        </Badge>
                      ) : null}
                      <StatusBadge status={v.status} className="text-[0.7rem]">
                        {VERTRAG_STATUS_LABELS[v.status] ?? v.status}
                      </StatusBadge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>Stammdaten anlegen</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {schnellzugriff.map((item) => (
              <Button
                key={item.href}
                variant="outline"
                className="justify-start"
                render={<Link href={item.href} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
