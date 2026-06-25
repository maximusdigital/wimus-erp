import Link from "next/link"
import { DoorOpen } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EINHEITSTYP_LABELS, type EinheitMitObjekt } from "@/types/einheit"

export function EinheitKarte({ einheit }: { einheit: EinheitMitObjekt }) {
  return (
    <Link href={`/einheiten/${einheit.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <DoorOpen className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {einheit.verwendungszweck_code ?? einheit.bezeichnung ?? "Einheit"}
              </span>
              <StatusBadge status={einheit.aktiv ? "aktiv" : "inaktiv"}>
                {einheit.aktiv ? "Aktiv" : "Inaktiv"}
              </StatusBadge>
            </div>
            <p className="truncate text-sm">{einheit.bezeichnung ?? "–"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {einheit.objekte?.kuerzel ?? "–"}
              {einheit.lage ? ` · ${einheit.lage}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {einheit.typ
                  ? (EINHEITSTYP_LABELS[einheit.typ] ?? einheit.typ)
                  : "–"}
              </span>
              <span>
                {einheit.flaeche != null ? `${einheit.flaeche} m²` : "– m²"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
