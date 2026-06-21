import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarClock,
  CircleAlert,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Mail,
  Receipt,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Trend = "up" | "down";

type Kpi = {
  label: string;
  value: string;
  hint: string;
  delta: string;
  trend: Trend;
  positive: boolean;
  icon: LucideIcon;
};

const kpis: Kpi[] = [
  {
    label: "Objekte",
    value: "48",
    hint: "324 Mieteinheiten gesamt",
    delta: "+2",
    trend: "up",
    positive: true,
    icon: Building2,
  },
  {
    label: "Mieter",
    value: "312",
    hint: "96,3 % der Einheiten belegt",
    delta: "+1,4 %",
    trend: "up",
    positive: true,
    icon: Users,
  },
  {
    label: "Offene Vorgänge",
    value: "17",
    hint: "4 davon überfällig",
    delta: "+3",
    trend: "up",
    positive: false,
    icon: ClipboardList,
  },
  {
    label: "Offene Posten",
    value: "24.850 €",
    hint: "verteilt auf 8 Mietkonten",
    delta: "−12,4 %",
    trend: "down",
    positive: true,
    icon: CircleDollarSign,
  },
];

type Activity = {
  title: string;
  detail: string;
  time: string;
  category: string;
  icon: LucideIcon;
  accent: string;
};

const activities: Activity[] = [
  {
    title: "Mietvertrag unterzeichnet",
    detail: "Wohnung 4. OG · Lindenstraße 12, Hamburg",
    time: "vor 12 Min.",
    category: "Vertrag",
    icon: FileText,
    accent: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Neue E-Mail von Familie Bergmann",
    detail: "Heizung im Treppenhaus ausgefallen",
    time: "vor 38 Min.",
    category: "E-Mail",
    icon: Mail,
    accent: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Zahlungseingang 1.240,00 €",
    detail: "Miete Juni · M. Yılmaz, Goethestraße 7",
    time: "vor 1 Std.",
    category: "Finanzen",
    icon: Banknote,
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Reparaturauftrag erstellt",
    detail: "Aufzugsstörung · Goethestraße 7",
    time: "vor 2 Std.",
    category: "Vorgang",
    icon: Wrench,
    accent: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Mahnung versendet",
    detail: "Mietrückstand Wohnung 2. OG · Parkallee 5",
    time: "vor 3 Std.",
    category: "Mahnung",
    icon: CircleAlert,
    accent: "text-red-600 dark:text-red-400",
  },
  {
    title: "Betriebskostenabrechnung freigegeben",
    detail: "Abrechnungsjahr 2025 · Ringstraße 3",
    time: "gestern, 16:42",
    category: "Finanzen",
    icon: Receipt,
    accent: "text-emerald-600 dark:text-emerald-400",
  },
];

type Deadline = {
  title: string;
  detail: string;
  date: string;
  urgent?: boolean;
};

const deadlines: Deadline[] = [
  {
    title: "Eigentümerversammlung",
    detail: "WEG Ringstraße 3",
    date: "24. Juni",
    urgent: true,
  },
  {
    title: "Heizungswartung",
    detail: "Lindenstraße 12",
    date: "27. Juni",
  },
  {
    title: "Mietvertrag läuft aus",
    detail: "Wohnung 1. OG · Goethestraße 7",
    date: "30. Juni",
  },
  {
    title: "Frist Betriebskostenabrechnung",
    detail: "Objekt Parkallee 5",
    date: "03. Juli",
  },
  {
    title: "Umsetzung WEG-Beschluss",
    detail: "Fassadensanierung Ringstraße 3",
    date: "08. Juli",
  },
];

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Überblick über Ihren Immobilienbestand – Stand 19. Juni 2026
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {kpi.value}
              </CardTitle>
              <div className="col-start-2 row-span-2 row-start-1 flex size-9 items-center justify-center self-start rounded-lg bg-muted text-muted-foreground">
                <kpi.icon className="size-4.5" />
              </div>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  kpi.positive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {kpi.delta}
              </span>
              <span className="text-muted-foreground">{kpi.hint}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="grid gap-1">
              <CardTitle>Letzte Aktivitäten</CardTitle>
              <CardDescription>
                Vorgänge und Buchungen der letzten 24 Stunden
              </CardDescription>
            </div>
            <Badge variant="outline">Alle anzeigen</Badge>
          </CardHeader>
          <CardContent className="flex flex-col">
            {activities.map((activity, index) => (
              <div
                key={activity.title}
                className={`flex items-start gap-3 py-3 ${
                  index !== activities.length - 1 ? "border-b" : ""
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-muted ${activity.accent}`}
                >
                  <activity.icon className="size-4.5" />
                </div>
                <div className="grid flex-1 gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">
                      {activity.title}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.detail}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 w-fit text-[0.7rem]"
                  >
                    {activity.category}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4.5 text-muted-foreground" />
              Anstehende Fristen
            </CardTitle>
            <CardDescription>Termine der nächsten drei Wochen</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {deadlines.map((deadline, index) => (
              <div
                key={deadline.title}
                className={`flex items-center gap-3 py-3 ${
                  index !== deadlines.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-md border bg-muted/40 py-1 leading-none">
                  <span className="text-sm font-semibold tabular-nums">
                    {deadline.date.split(" ")[0]}
                  </span>
                  <span className="text-[0.65rem] text-muted-foreground">
                    {deadline.date.split(" ")[1]}
                  </span>
                </div>
                <div className="grid flex-1 gap-0.5">
                  <p className="text-sm font-medium leading-tight">
                    {deadline.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deadline.detail}
                  </p>
                </div>
                {deadline.urgent ? (
                  <Badge variant="destructive" className="shrink-0">
                    Dringend
                  </Badge>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
