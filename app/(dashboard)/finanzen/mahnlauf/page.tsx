import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { MahnungErstellenButton } from "@/components/forderungen/mahnung-erstellen-button"
import { formatEUR } from "@/lib/utils/format"
import { offenerBetrag } from "@/lib/utils/forderungen"
import { mahnlauf, tageUeberfaellig } from "@/lib/utils/mahnlauf"
import { kontaktName } from "@/types/kontakt"
import {
  FORDERUNG_TYP_LABELS,
  type ForderungMitRelationen,
} from "@/types/forderung"
import { MAHN_STUFE_LABELS } from "@/types/mahnung"

export const metadata = {
  title: "Mahnlauf",
}

const SELECT =
  "*, kontakt:kontakte!kontakt_id(vorname, nachname, firmenname), mietvertrag:mietvertraege(aktenzeichen)"

export default async function MahnlaufPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("forderungen")
    .select(SELECT)
    .neq("status", "bezahlt")
    .neq("status", "abgeschrieben")
    .order("faellig_am", { ascending: true, nullsFirst: false })

  const forderungen = (data ?? []) as unknown as ForderungMitRelationen[]
  const heute = new Date().toISOString().slice(0, 10)

  const vorschlaege = mahnlauf(forderungen, heute)
  const byId = new Map(forderungen.map((f) => [f.id, f]))

  // Vorschläge mit Forderungsdaten anreichern (Reihenfolge der Forderungen).
  const zeilen = vorschlaege
    .map((v) => {
      const f = byId.get(v.forderung_id)
      if (!f) return null
      return { vorschlag: v, forderung: f }
    })
    .filter((z): z is { vorschlag: (typeof vorschlaege)[number]; forderung: ForderungMitRelationen } => z !== null)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/finanzen"
            className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border"
            aria-label="Zurück zu Finanzen"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              Mahnlauf
              <Badge variant="secondary">{zeilen.length}</Badge>
            </h1>
            <p className="text-muted-foreground text-sm">
              Überfällige Forderungen in Mahnungen überführen.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : zeilen.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="font-medium">Keine mahnfähigen Forderungen</p>
            <p className="text-muted-foreground text-sm">
              Aktuell ist keine überfällige Forderung mahnfähig.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Forderung</TableHead>
                  <TableHead className="text-right">Offen</TableHead>
                  <TableHead className="text-right">Tage überfällig</TableHead>
                  <TableHead>Nächste Stufe</TableHead>
                  <TableHead className="text-right">Zinsen</TableHead>
                  <TableHead className="text-right">Gebühren</TableHead>
                  <TableHead className="text-right">Gesamt</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zeilen.map(({ vorschlag, forderung }) => {
                  const stufeLabel =
                    MAHN_STUFE_LABELS[vorschlag.stufe] ??
                    `Stufe ${vorschlag.stufe}`
                  return (
                    <TableRow key={vorschlag.forderung_id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/finanzen/forderungen/${forderung.id}`}
                          className="hover:underline"
                        >
                          {forderung.kontakt
                            ? kontaktName(forderung.kontakt)
                            : "Forderung"}
                        </Link>
                        {forderung.mietvertrag?.aktenzeichen ? (
                          <span className="text-muted-foreground block text-xs">
                            {forderung.mietvertrag.aktenzeichen}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {FORDERUNG_TYP_LABELS[forderung.forderung_typ] ??
                          forderung.forderung_typ}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(offenerBetrag(forderung))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {tageUeberfaellig(forderung.faellig_am, heute)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stufeLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(vorschlag.zinsen)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(vorschlag.gebuehren)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatEUR(vorschlag.gesamt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <MahnungErstellenButton
                          forderungId={forderung.id}
                          stufeLabel={stufeLabel}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {zeilen.map(({ vorschlag, forderung }) => {
              const stufeLabel =
                MAHN_STUFE_LABELS[vorschlag.stufe] ?? `Stufe ${vorschlag.stufe}`
              return (
                <Card key={vorschlag.forderung_id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/finanzen/forderungen/${forderung.id}`}
                          className="font-medium hover:underline"
                        >
                          {forderung.kontakt
                            ? kontaktName(forderung.kontakt)
                            : "Forderung"}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {FORDERUNG_TYP_LABELS[forderung.forderung_typ] ??
                            forderung.forderung_typ}
                        </p>
                      </div>
                      <Badge variant="outline">{stufeLabel}</Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Offen</dt>
                      <dd className="text-right tabular-nums">
                        {formatEUR(offenerBetrag(forderung))}
                      </dd>
                      <dt className="text-muted-foreground">Tage überfällig</dt>
                      <dd className="text-right tabular-nums">
                        {tageUeberfaellig(forderung.faellig_am, heute)}
                      </dd>
                      <dt className="text-muted-foreground">Zinsen</dt>
                      <dd className="text-right tabular-nums">
                        {formatEUR(vorschlag.zinsen)}
                      </dd>
                      <dt className="text-muted-foreground">Gebühren</dt>
                      <dd className="text-right tabular-nums">
                        {formatEUR(vorschlag.gebuehren)}
                      </dd>
                      <dt className="text-muted-foreground font-medium">
                        Gesamt
                      </dt>
                      <dd className="text-right font-medium tabular-nums">
                        {formatEUR(vorschlag.gesamt)}
                      </dd>
                    </dl>
                    <MahnungErstellenButton
                      forderungId={forderung.id}
                      stufeLabel={stufeLabel}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
