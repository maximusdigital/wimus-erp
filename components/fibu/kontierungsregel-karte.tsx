import Link from "next/link"

import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  KONTIERUNG_SCOPE_LABELS,
  type KontierungsregelMitFirma,
} from "@/types/kontierungsregel"

export function KontierungsregelKarte({
  regel,
}: {
  regel: KontierungsregelMitFirma
}) {
  const r = regel
  return (
    <Link href={`/fibu/kontierungsregeln/${r.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{r.match}</span>
            <StatusBadge status={r.aktiv ? "aktiv" : "inaktiv"}>
              {r.aktiv ? "Aktiv" : "Inaktiv"}
            </StatusBadge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Soll {r.soll_konto}</span>
            {r.ust_satz != null ? <span>{r.ust_satz} % USt</span> : null}
            <span>Prio {r.prioritaet}</span>
            <span>
              {r.scope === "einheit" && r.firma
                ? r.firma.name
                : KONTIERUNG_SCOPE_LABELS[r.scope] ?? r.scope}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
