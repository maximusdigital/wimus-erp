"use client"

import { Camera, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"

/**
 * MobileCard (Design System 40, Kap. 6.2)
 *
 * Karte fuer die Hausmeister-/MA-App (PWA): grosse Touch-Targets
 * (min. 48px), prominenter Foto-Button, optionaler Status-Toggle.
 * Mobile-first ab 390px.
 */
function MobileCard({
  title,
  subtitle,
  icon: Icon,
  status,
  onPhoto,
  onToggleStatus,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: LucideIcon
  status?: string
  onPhoto?: () => void
  onToggleStatus?: () => void
}) {
  return (
    <div
      data-slot="mobile-card"
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-card p-4 text-card-foreground shadow-sm ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-medium">{title}</div>
          {subtitle ? (
            <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {status ? (
          onToggleStatus ? (
            <button
              type="button"
              onClick={onToggleStatus}
              className="shrink-0 rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label="Status umschalten"
            >
              <StatusBadge status={status} />
            </button>
          ) : (
            <StatusBadge status={status} className="shrink-0" />
          )
        ) : null}
      </div>

      {children}

      {onPhoto ? (
        <Button
          type="button"
          size="lg"
          onClick={onPhoto}
          className="h-12 w-full text-base"
        >
          <Camera className="size-5" />
          Foto aufnehmen
        </Button>
      ) : null}
    </div>
  )
}

export { MobileCard }
