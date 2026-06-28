import Link from "next/link"
import { AlertTriangle, ChevronRight, Euro, Gavel, Landmark, PiggyBank, Receipt } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatEUR } from "@/lib/utils/format"

export const metadata = {
  title: "Finanzen",
}

const OFFENE_STATUS = ["offen", "versendet", "inkasso"]

export default async function FinanzenPage() {
  const supabase = await createServerClient()

  const [mahnungenRes, kautionenRes, forderungenRes] = await Promise.all([
    supabase.schema("wimus").from("mahnungen").select("gesamtforderung, status"),
    supabase.schema("wimus").from("kautionen").select("betrag, status"),
    supabase
      .schema("wimus")
      .from("forderungen")
      .select("betrag, bezahlt_betrag, status"),
  ])

  const mahnungen = (mahnungenRes.data ?? []) as {
    gesamtforderung: number | null
    status: string
  }[]
  const kautionen = (kautionenRes.data ?? []) as {
    betrag: number | null
    status: string
  }[]
  const forderungen = (forderungenRes.data ?? []) as {
    betrag: number | null
    bezahlt_betrag: number | null
    status: string
  }[]

  const offeneMahnungen = mahnungen.filter((m) =>
    OFFENE_STATUS.includes(m.status)
  )
  const anzahlOffen = offeneMahnungen.length
  const summeOffen = offeneMahnungen.reduce(
    (sum, m) => sum + (m.gesamtforderung ?? 0),
    0
  )
  const summeHinterlegt = kautionen
    .filter((k) => k.status === "hinterlegt")
    .reduce((sum, k) => sum + (k.betrag ?? 0), 0)
  const offeneForderungen = forderungen.filter(
    (f) => f.status !== "bezahlt" && f.status !== "abgeschrieben"
  )
  const summeOffeneForderungen = offeneForderungen.reduce(
    (sum, f) => sum + ((f.betrag ?? 0) - (f.bezahlt_betrag ?? 0)),
    0
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Finanzen</h1>
        <p className="text-muted-foreground text-sm">
          Forderungen, Mahnwesen und Kautionsverwaltung im Überblick.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Offene Mahnungen
            </CardTitle>
            <AlertTriangle className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{anzahlOffen}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Offene Forderung
            </CardTitle>
            <Euro className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatEUR(summeOffen)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Hinterlegte Kautionen
            </CardTitle>
            <PiggyBank className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatEUR(summeHinterlegt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Offene Forderungen
            </CardTitle>
            <Receipt className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatEUR(summeOffeneForderungen)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/finanzen/forderungen" className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Receipt className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Forderungen</p>
                <p className="text-muted-foreground text-sm">
                  Forderungen erfassen, verrechnen und eskalieren.
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/finanzen/mahnungen" className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <AlertTriangle className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Mahnwesen</p>
                <p className="text-muted-foreground text-sm">
                  Mahnungen anlegen, eskalieren und verfolgen.
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/finanzen/mahnlauf" className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Gavel className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Mahnlauf</p>
                <p className="text-muted-foreground text-sm">
                  Überfällige Forderungen automatisch mahnen.
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/finanzen/kautionen" className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <PiggyBank className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Kautionen</p>
                <p className="text-muted-foreground text-sm">
                  Kautionen erfassen, hinterlegen und abrechnen.
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/finanzen/bank" className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Landmark className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Bank-Abgleich</p>
                <p className="text-muted-foreground text-sm">
                  KSK/WISO-CSV importieren, Zahlungen automatisch zuordnen, OP abgleichen.
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
