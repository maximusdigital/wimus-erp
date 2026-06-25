import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/format"
import {
  einheitLabel,
  vorgangTitel,
  VORGANG_PRIORITAET_LABELS,
  VORGANG_PRIORITAET_VARIANT,
  VORGANG_STATUS_LABELS,
  VORGANG_STATUS_VARIANT,
  VORGANG_TYP_LABELS,
  type VorgangMitRelationen,
} from "@/types/vorgang"

/** Welcher Beziehungs-Kontext zeigt diese Liste? Spalte wird dann ausgeblendet. */
type Kontext = "objekt" | "einheit"

/**
 * Kompakte, anklickbare Vorgänge-Liste.
 * Wird in den Detailseiten von Objekt und Einheit verwendet.
 */
export function VorgaengeListe({
  vorgaenge,
  kontext,
  emptyText = "Keine Vorgänge zugeordnet.",
}: {
  vorgaenge: VorgangMitRelationen[]
  kontext?: Kontext
  emptyText?: string
}) {
  if (vorgaenge.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="flex flex-col">
      {vorgaenge.map((v, index) => {
        const meta = [
          kontext !== "objekt" && v.objekt?.kuerzel ? v.objekt.kuerzel : null,
          kontext !== "einheit" && einheitLabel(v.einheit)
            ? einheitLabel(v.einheit)
            : null,
          v.typ ? (VORGANG_TYP_LABELS[v.typ] ?? v.typ) : null,
          v.leistungsdatum ? `Leistung: ${formatDate(v.leistungsdatum)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")

        return (
          <li key={v.id}>
            <Link
              href={`/vorgaenge/${v.id}`}
              className={`flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40 ${
                index !== vorgaenge.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ClipboardList className="size-4" />
              </div>
              <div className="grid flex-1 gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">
                    {vorgangTitel(v)}
                  </span>
                  <Badge
                    variant={VORGANG_STATUS_VARIANT[v.status] ?? "secondary"}
                    className="shrink-0 text-[0.7rem]"
                  >
                    {VORGANG_STATUS_LABELS[v.status] ?? v.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {meta || "–"}
                </span>
              </div>
              <Badge
                variant={
                  VORGANG_PRIORITAET_VARIANT[v.prioritaet] ?? "secondary"
                }
                className="shrink-0 text-[0.7rem]"
              >
                {VORGANG_PRIORITAET_LABELS[v.prioritaet] ?? v.prioritaet}
              </Badge>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
