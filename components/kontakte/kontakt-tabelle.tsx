import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  KONTAKT_TYP_LABELS,
  KONTAKT_TYP_VARIANT,
  kontaktName,
  type Kontakt,
} from "@/types/kontakt"

export function KontaktTabelle({ kontakte }: { kontakte: Kontakt[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Ort</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kontakte.map((k) => (
            <TableRow key={k.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <Link href={`/kontakte/${k.id}`} className="hover:underline">
                  {kontaktName(k)}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={KONTAKT_TYP_VARIANT[k.typ] ?? "secondary"}>
                  {KONTAKT_TYP_LABELS[k.typ] ?? k.typ}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {k.email ?? "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {k.telefon ?? "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {k.ort ?? "–"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
