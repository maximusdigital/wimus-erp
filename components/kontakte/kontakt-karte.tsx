import Link from "next/link"
import { User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { kontaktName, kontaktRollen, type Kontakt } from "@/types/kontakt"

export function KontaktKarte({ kontakt }: { kontakt: Kontakt }) {
  const rollen = kontaktRollen(kontakt)
  return (
    <Link href={`/kontakte/${kontakt.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="truncate font-medium">
                {kontaktName(kontakt)}
              </span>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                {rollen.length > 0 ? (
                  rollen.map((r) => (
                    <Badge key={r} variant="secondary">
                      {r}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Keine Rolle</Badge>
                )}
              </div>
            </div>
            <p className="truncate text-sm">{kontakt.email ?? "–"}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {kontakt.telefon_mobil ?? kontakt.telefon_festnetz ?? "–"}
              </span>
              <span>{kontakt.stadt ?? "–"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
