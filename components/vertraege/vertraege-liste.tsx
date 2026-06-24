import Link from "next/link"
import { FileText } from "lucide-react"

import { StatusBadge } from "@/components/ui/status-badge"
import { formatEUR } from "@/lib/utils/format"
import { kontaktName } from "@/types/kontakt"
import {
  VERTRAGSART_LABELS,
  VERTRAG_STATUS_LABELS,
  warmmiete,
  type VertragMitRelationen,
} from "@/types/vertrag"

/** Welcher Beziehungs-Kontext zeigt diese Liste? Spalte wird dann ausgeblendet. */
type Kontext = "objekt" | "einheit" | "mieter"

/**
 * Kompakte, anklickbare Verträge-Liste.
 * Wird in den Detailseiten von Objekt, Einheit und Kontakt verwendet,
 * um die zugeordneten Verträge bidirektional zu verlinken.
 * `kontext` blendet die Spalte aus, die ohnehin der aktuelle Datensatz ist.
 */
export function VertraegeListe({
  vertraege,
  kontext,
  emptyText = "Keine Verträge zugeordnet.",
}: {
  vertraege: VertragMitRelationen[]
  kontext?: Kontext
  emptyText?: string
}) {
  if (vertraege.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="flex flex-col">
      {vertraege.map((v, index) => {
        const titel =
          v.vertragsnummer ??
          (v.vertragsart
            ? (VERTRAGSART_LABELS[v.vertragsart] ?? v.vertragsart)
            : "Vertrag")
        const meta = [
          kontext !== "mieter" && v.mieter ? kontaktName(v.mieter) : null,
          kontext !== "objekt" && v.objekt?.kuerzel ? v.objekt.kuerzel : null,
          kontext !== "einheit" && v.einheit?.verwendungszweck_code
            ? v.einheit.verwendungszweck_code
            : null,
          v.vertragsart ? (VERTRAGSART_LABELS[v.vertragsart] ?? v.vertragsart) : null,
        ]
          .filter(Boolean)
          .join(" · ")
        const warm = warmmiete(v)

        return (
          <li key={v.id}>
            <Link
              href={`/vertraege/${v.id}`}
              className={`flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40 ${
                index !== vertraege.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="size-4" />
              </div>
              <div className="grid flex-1 gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">
                    {titel}
                  </span>
                  <StatusBadge
                    status={v.status}
                    className="shrink-0 text-[0.7rem]"
                  >
                    {VERTRAG_STATUS_LABELS[v.status] ?? v.status}
                  </StatusBadge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {meta || "–"}
                </span>
              </div>
              {warm != null ? (
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatEUR(warm)}
                </span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
