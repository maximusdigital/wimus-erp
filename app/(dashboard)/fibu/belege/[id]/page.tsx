import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BelegKorrekturForm } from "@/components/fibu/beleg-korrektur-form"
import { BelegAktionen } from "@/components/fibu/beleg-aktionen"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"
import { formatDate } from "@/lib/utils/format"
import { BELEG_STATUS_LABELS, type Beleg } from "@/types/beleg"

export const metadata = { title: "Beleg" }

type Korrektur = {
  id: string
  feld: string
  alt_wert: string | null
  neu_wert: string | null
  am: string
}

export default async function BelegDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: bData }, { data: fData }, { data: kData }] = await Promise.all([
    supabase.from("belege").select("*").eq("id", id).maybeSingle(),
    supabase.from("firmen").select("id, name, kuerzel").order("name"),
    supabase
      .from("fibu_korrekturen")
      .select("id, feld, alt_wert, neu_wert, am")
      .eq("beleg_id", id)
      .order("am", { ascending: false }),
  ])

  const beleg = bData as Beleg | null
  if (!beleg) notFound()
  const firmen = (fData ?? []) as FirmaOption[]
  const korrekturen = (kData ?? []) as Korrektur[]
  const offen = beleg.status !== "gebucht" && beleg.status !== "abgelehnt"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link
          href="/fibu/belege"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Zurück zu Belegen
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {beleg.lieferant_name ?? "Beleg"}
              {beleg.belegnummer ? ` · ${beleg.belegnummer}` : ""}
            </h1>
            <StatusBadge status={beleg.status}>
              {BELEG_STATUS_LABELS[beleg.status] ?? beleg.status}
            </StatusBadge>
            {beleg.ist_erechnung ? (
              <span className="text-success text-xs">E-Rechnung</span>
            ) : null}
          </div>
          {offen ? (
            <BelegAktionen id={beleg.id} freigebbar={!!beleg.soll_konto} />
          ) : null}
        </div>
      </div>

      {beleg.review_flag && beleg.review_gruende?.length ? (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
          <span className="font-medium">Prüfen:</span>{" "}
          {beleg.review_gruende.join(" · ")}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Belegdaten &amp; Kontierung</CardTitle>
          <p className="text-muted-foreground text-xs">
            Änderungen werden als Korrektur protokolliert (lernender Loop).
          </p>
        </CardHeader>
        <CardContent>
          <BelegKorrekturForm beleg={beleg} firmen={firmen} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Korrektur-Historie ({korrekturen.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {korrekturen.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Noch keine Korrekturen.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Feld</TableHead>
                    <TableHead>Alt</TableHead>
                    <TableHead>Neu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {korrekturen.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(k.am)}
                      </TableCell>
                      <TableCell className="font-medium">{k.feld}</TableCell>
                      <TableCell className="text-muted-foreground line-through">
                        {k.alt_wert ?? "–"}
                      </TableCell>
                      <TableCell>{k.neu_wert ?? "–"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
