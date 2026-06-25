import Link from "next/link"
import { DoorOpen } from "lucide-react"

import { StatusBadge } from "@/components/ui/status-badge"
import { EINHEITSTYP_LABELS, type Einheit } from "@/types/einheit"

/**
 * Kompakte, anklickbare Einheiten-Liste.
 * Wird im Objekt-Detail (alle Einheiten) und im Einheit-Detail
 * (Geschwister-Einheiten) verwendet – bidirektionale Navigation.
 */
export function EinheitenListe({
  einheiten,
  currentId,
  emptyText = "Keine Einheiten erfasst.",
}: {
  einheiten: Einheit[]
  currentId?: string
  emptyText?: string
}) {
  const items = einheiten.filter((e) => e.id !== currentId)

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="flex flex-col">
      {items.map((e, index) => {
        const titel = e.verwendungszweck_code ?? e.bezeichnung ?? "Einheit"
        const meta = [
          e.typ ? (EINHEITSTYP_LABELS[e.typ] ?? e.typ) : null,
          e.lage,
          e.flaeche != null ? `${e.flaeche} m²` : null,
        ]
          .filter(Boolean)
          .join(" · ")

        return (
          <li key={e.id}>
            <Link
              href={`/einheiten/${e.id}`}
              className={`flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40 ${
                index !== items.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <DoorOpen className="size-4" />
              </div>
              <div className="grid flex-1 gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">
                    {titel}
                  </span>
                  <StatusBadge
                    status={e.aktiv ? "aktiv" : "inaktiv"}
                    className="shrink-0 text-[0.7rem]"
                  >
                    {e.aktiv ? "Aktiv" : "Inaktiv"}
                  </StatusBadge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {meta || "–"}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
