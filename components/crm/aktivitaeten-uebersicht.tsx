"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import { AKTIVITAET_TYPEN, aktivitaetLabel, type AktivitaetTyp } from "@/lib/crm/constants"
import type { DealAktivitaet } from "@/types/crm"

type AktMitDeal = DealAktivitaet & { deal?: { id: string; titel: string } | null }

const FILTER = [{ value: "alle", label: "Alle" }, ...AKTIVITAET_TYPEN] as const

export function AktivitaetenUebersicht({ items }: { items: AktMitDeal[] }) {
  const router = useRouter()
  const [filter, setFilter] = React.useState<string>("alle")

  const sichtbar = items.filter((a) => filter === "alle" || a.typ === filter)

  async function toggle(a: AktMitDeal) {
    await fetch(`/api/crm/aktivitaeten/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ erledigt: !a.erledigt }),
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {FILTER.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <ul className="flex flex-col divide-y rounded-lg border">
        {sichtbar.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">Keine Aktivitäten</li>
        ) : (
          sichtbar.map((a) => {
            const ueberfaellig = !a.erledigt && a.faellig_am && new Date(a.faellig_am) < new Date()
            const heute =
              !a.erledigt &&
              a.faellig_am &&
              new Date(a.faellig_am).toDateString() === new Date().toDateString()
            return (
              <li key={a.id} className="flex items-center gap-3 p-3">
                <button
                  onClick={() => toggle(a)}
                  aria-label="Erledigt umschalten"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    a.erledigt ? "bg-success text-white" : "bg-background"
                  )}
                >
                  {a.erledigt ? <Check className="size-3.5" /> : null}
                </button>
                <span className="w-20 shrink-0 text-xs text-muted-foreground">
                  {aktivitaetLabel(a.typ)}
                </span>
                <span className={cn("flex-1 text-sm", a.erledigt && "text-muted-foreground line-through")}>
                  {a.titel}
                </span>
                {a.deal ? (
                  <Link
                    href={`/crm/deals/${a.deal.id}`}
                    className="hidden text-xs text-secondary hover:underline sm:inline"
                  >
                    {a.deal.titel}
                  </Link>
                ) : null}
                {a.faellig_am ? (
                  <span
                    className={cn(
                      "w-24 text-right text-xs",
                      ueberfaellig ? "text-danger" : heute ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    {formatDate(a.faellig_am)}
                  </span>
                ) : (
                  <span className="w-24" />
                )}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

export type { AktMitDeal }
