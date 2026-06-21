import Link from "next/link"
import { User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  KONTAKT_TYP_LABELS,
  KONTAKT_TYP_VARIANT,
  kontaktName,
  type Kontakt,
} from "@/types/kontakt"

export function KontaktKarte({ kontakt }: { kontakt: Kontakt }) {
  return (
    <Link href={`/kontakte/${kontakt.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {kontaktName(kontakt)}
              </span>
              <Badge variant={KONTAKT_TYP_VARIANT[kontakt.typ] ?? "secondary"}>
                {KONTAKT_TYP_LABELS[kontakt.typ] ?? kontakt.typ}
              </Badge>
            </div>
            <p className="truncate text-sm">{kontakt.email ?? "–"}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{kontakt.telefon ?? "–"}</span>
              <span>{kontakt.ort ?? "–"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
