import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

/**
 * KpiCard (Design System 40, Kap. 6.2)
 *
 * Dashboard-KPI: Wert gross (text-3xl), Label klein darunter, Trend-Pfeil
 * farbcodiert (up=success, down=danger), Icon links.
 *
 * Beispiel:
 *   <KpiCard label="Portfoliowert" value="6,9 Mio EUR" icon={Building2}
 *            trend={{ direction: "up", value: "+3,2 %" }} />
 */
function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  className,
  ...props
}: React.ComponentProps<typeof Card> & {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  trend?: {
    direction: "up" | "down"
    value: string
  }
  /** Optionale Zusatzzeile unter dem Label (z. B. "5 Einheiten gesamt"). */
  hint?: React.ReactNode
}) {
  const TrendIcon = trend?.direction === "down" ? ArrowDownRight : ArrowUpRight

  return (
    <Card
      data-slot="kpi-card"
      className={cn("gap-0", className)}
      {...props}
    >
      <div className="flex items-start gap-3 px-(--card-spacing)">
        {Icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-3xl leading-tight font-bold text-foreground">
            {value}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="truncate text-sm text-muted-foreground">{label}</span>
            {trend ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium",
                  trend.direction === "up" ? "text-success" : "text-danger"
                )}
              >
                <TrendIcon className="size-3" />
                {trend.value}
              </span>
            ) : null}
          </div>
          {hint ? (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export { KpiCard }
