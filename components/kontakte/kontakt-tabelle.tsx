import Link from "next/link"

import { RowActions } from "@/components/shared/row-actions"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { kontaktName, kontaktRollen, type Kontakt } from "@/types/kontakt"

export function KontaktTabelle({ kontakte }: { kontakte: Kontakt[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Rollen</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Stadt</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {kontakte.map((k) => {
            const rollen = kontaktRollen(k)
            return (
              <TableRow key={k.id} className="group hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/kontakte/${k.id}`} className="hover:underline">
                    {kontaktName(k)}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {rollen.length > 0 ? (
                      rollen.map((r) => (
                        <Badge key={r} variant="secondary">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">–</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {k.email ?? "–"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {k.telefon_mobil ?? k.telefon_festnetz ?? "–"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {k.stadt ?? "–"}
                </TableCell>
                <TableCell>
                  <RowActions
                    editHref={`/kontakte/${k.id}/bearbeiten`}
                    destructive={{
                      kind: "soft",
                      label: "Löschen",
                      deleteUrl: `/api/kontakte/${k.id}`,
                      description: `Kontakt "${kontaktName(k)}" wird gelöscht.`,
                    }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
