import { FileText } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BelegUpload } from "@/components/fibu/beleg-upload"
import { BelegAktionen } from "@/components/fibu/beleg-aktionen"
import { formatDate, formatEUR } from "@/lib/utils/format"
import { BELEG_STATUS_LABELS, type BelegMitFirma } from "@/types/beleg"

export const metadata = { title: "Belege & Buchungsfreigabe" }

const AMPEL: Record<string, string> = {
  rot: "bg-danger",
  gruen: "bg-success",
  grau: "bg-muted-foreground",
}

function ampel(b: BelegMitFirma): keyof typeof AMPEL {
  if (b.status === "gebucht") return "grau"
  return b.review_flag ? "rot" : "gruen"
}

export default async function BelegePage() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("belege")
    .select("*, firma:firmen(id, name, kuerzel)")
    .order("created_at", { ascending: false })

  const belege = (data ?? []) as BelegMitFirma[]
  const offen = belege.filter((b) => b.status !== "gebucht" && b.status !== "abgelehnt")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Belege &amp; Buchungsfreigabe
        </h1>
        <p className="text-muted-foreground text-sm">
          {belege.length} Belege · {offen.length} offen · KI schlägt vor, du gibst frei
          (Suggest not Autobook)
        </p>
      </div>

      <BelegUpload />

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      ) : belege.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <div>
            <p className="font-medium">Noch keine Belege</p>
            <p className="text-muted-foreground text-sm">
              Lade oben einen Beleg hoch – die Pipeline erkennt, validiert und
              kontiert ihn.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Lieferant</TableHead>
                  <TableHead>Beleg-Nr.</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Brutto</TableHead>
                  <TableHead>Soll-Konto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {belege.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50">
                    <TableCell>
                      <span
                        className={`inline-block size-2.5 rounded-full ${AMPEL[ampel(b)]}`}
                        title={
                          b.review_gruende?.length
                            ? b.review_gruende.join(" · ")
                            : "ok"
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {b.lieferant_name ?? "–"}
                      {b.ist_erechnung ? (
                        <span className="text-success ml-1 text-xs">E-Rechnung</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {b.belegnummer ?? "–"}
                    </TableCell>
                    <TableCell>{formatDate(b.belegdatum)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEUR(b.brutto)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {b.soll_konto ?? (
                        <span className="text-danger text-xs">offen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.status}>
                        {BELEG_STATUS_LABELS[b.status] ?? b.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.status === "gebucht" || b.status === "abgelehnt" ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <BelegAktionen id={b.id} freigebbar={!!b.soll_konto} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {belege.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={`inline-block size-2.5 rounded-full ${AMPEL[ampel(b)]}`}
                      />
                      {b.lieferant_name ?? "–"}
                    </span>
                    <StatusBadge status={b.status}>
                      {BELEG_STATUS_LABELS[b.status] ?? b.status}
                    </StatusBadge>
                  </div>
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>{b.belegnummer ?? "–"}</span>
                    <span>{formatDate(b.belegdatum)}</span>
                    <span>{formatEUR(b.brutto)}</span>
                    <span>Konto {b.soll_konto ?? "offen"}</span>
                  </div>
                  {b.status !== "gebucht" && b.status !== "abgelehnt" ? (
                    <div className="mt-3">
                      <BelegAktionen id={b.id} freigebbar={!!b.soll_konto} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
