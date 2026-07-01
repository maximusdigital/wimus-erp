import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = { title: "Benutzer – Einstellungen" }

type BenutzerRow = {
  id: string
  email: string | null
  vorname: string | null
  nachname: string | null
  aktiv: boolean | null
  mfa_aktiv: boolean | null
  benutzer_rollen: { rolle_id: string }[] | null
}

function name(b: BenutzerRow): string {
  return [b.vorname, b.nachname].filter(Boolean).join(" ") || b.email || "–"
}

export default async function BenutzerVerwaltungPage() {
  const supabase = await createServerClient()
  // RLS-Client → nur Benutzer der eigenen Mandanten (mandant_isolation).
  const [{ data: benutzerData }, { data: rollenData }] = await Promise.all([
    supabase
      .schema("wimus")
      .from("benutzer")
      .select("id, email, vorname, nachname, aktiv, mfa_aktiv, benutzer_rollen(rolle_id)")
      .order("nachname", { nullsFirst: false }),
    supabase.schema("wimus").from("rollen").select("id, name"),
  ])
  const benutzer = (benutzerData as BenutzerRow[] | null) ?? []
  const rollenName = new Map((rollenData ?? []).map((r: { id: string; name: string }) => [r.id, r.name]))

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
        <div className="mt-2">
          <h1 className="text-xl font-semibold tracking-tight">Benutzer</h1>
          <p className="text-sm text-muted-foreground">
            {benutzer.length} Benutzer · Stammdaten &amp; Aktiv-Status verwalten (Rollen: nur ansehen)
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rollen</TableHead>
              <TableHead>MFA</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benutzer.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Keine Benutzer.
                </TableCell>
              </TableRow>
            ) : (
              benutzer.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/einstellungen/benutzer/${b.id}/bearbeiten`}
                      className="hover:underline"
                    >
                      {name(b)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.email ?? "–"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(b.benutzer_rollen ?? []).map((br) => (
                        <Badge key={br.rolle_id} variant="secondary">
                          {rollenName.get(br.rolle_id) ?? "?"}
                        </Badge>
                      ))}
                      {(b.benutzer_rollen ?? []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">–</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.mfa_aktiv ? (
                      <Badge variant="outline">MFA</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.aktiv === false ? "inaktiv" : "aktiv"}>
                      {b.aktiv === false ? "Inaktiv" : "Aktiv"}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
