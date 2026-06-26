import Link from "next/link"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import type { LieferantMitFirma } from "@/types/lieferant"

export function LieferantKarte({
  lieferant,
}: {
  lieferant: LieferantMitFirma
}) {
  const l = lieferant
  return (
    <Link href={`/fibu/lieferanten/${l.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{l.name}</span>
            <StatusBadge status={l.aktiv ? "aktiv" : "inaktiv"}>
              {l.aktiv ? "Aktiv" : "Inaktiv"}
            </StatusBadge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {l.standard_gewerk ? <span>{l.standard_gewerk}</span> : null}
            {l.standard_konto ? <span>Konto {l.standard_konto}</span> : null}
            {l.alias && l.alias.length > 0 ? (
              <span>Alias: {l.alias.join(", ")}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
