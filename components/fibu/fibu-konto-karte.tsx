import Link from "next/link"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  KONTOART_LABELS,
  SKR_BASIS_LABELS,
  type FibuKontoMitFirma,
} from "@/types/fibu-konto"

export function FibuKontoKarte({ konto }: { konto: FibuKontoMitFirma }) {
  const k = konto
  return (
    <Link href={`/fibu/konten/${k.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">
              <span className="tabular-nums">{k.kontonummer}</span> · {k.bezeichnung}
            </span>
            <StatusBadge status={k.aktiv ? "aktiv" : "inaktiv"}>
              {k.aktiv ? "Aktiv" : "Inaktiv"}
            </StatusBadge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {k.skr_basis ? <span>{SKR_BASIS_LABELS[k.skr_basis] ?? k.skr_basis}</span> : null}
            {k.kontoart ? <span>{KONTOART_LABELS[k.kontoart] ?? k.kontoart}</span> : null}
            {k.ust_automatik ? <span>USt {k.ust_automatik}</span> : null}
            <span>{k.firma?.name ?? "Alle Firmen"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
