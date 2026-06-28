import { createServerClient } from "@/lib/supabase/server"
import { getAudit } from "@/lib/historie/audit"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Einstellungen – Audit-Log" }

const OP_FARBE: Record<string, "secondary" | "default" | "destructive"> = {
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
}

export default async function AuditPage() {
  const supabase = await createServerClient()
  const eintraege = await getAudit(supabase, { limit: 200 })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Audit-Log</h1>
        <p className="text-sm text-muted-foreground">
          Technischer, lückenloser Änderungsverlauf kritischer Tabellen (append-only, DB-Trigger).
          Für Forensik/DSGVO-Auskunft. Mandant-isoliert (RLS).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zeitpunkt</TableHead>
              <TableHead>Tabelle</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Datensatz</TableHead>
              <TableHead>Geänderte Felder</TableHead>
              <TableHead>Akteur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eintraege.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Keine Audit-Einträge (Trigger erfasst Änderungen ab Einspielung von Migration 028).
                </TableCell>
              </TableRow>
            ) : (
              eintraege.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(e.zeitpunkt).toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.tabelle}</TableCell>
                  <TableCell>
                    <Badge variant={OP_FARBE[e.operation] ?? "secondary"}>{e.operation}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {e.datensatz_id?.slice(0, 8) ?? "–"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.geaendert_felder?.length ? e.geaendert_felder.join(", ") : "–"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.akteur_id ? (
                      <span className="font-mono">{e.akteur_id.slice(0, 8)}</span>
                    ) : (
                      <Badge variant="secondary">{e.akteur_quelle}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Hinweis: Rollen-Restriktion (nur Verwalter/Admin) ist app-seitig noch offen (Folge-Punkt);
        aktuell schützt die Mandanten-RLS vor fremden Mandanten.
      </p>
    </div>
  )
}
