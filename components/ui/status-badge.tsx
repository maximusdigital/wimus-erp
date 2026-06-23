import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * StatusBadge (Design System 40, Kap. 6.2)
 *
 * Farbcodierter Status-Badge:
 *   aktiv      -> success (gruen)
 *   gekuendigt -> danger  (rot)
 *   ausstehend -> warning (gelb)
 *   entwurf    -> muted   (grau)
 *
 * Der Status-String wird automatisch gemappt. Unbekannte Werte fallen auf
 * `muted` zurueck. Mit `tone` laesst sich das Mapping explizit ueberschreiben.
 */
const statusBadgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap capitalize",
  {
    variants: {
      tone: {
        success: "bg-success/10 text-success",
        danger: "bg-danger/10 text-danger",
        warning: "bg-warning/10 text-[color-mix(in_oklch,var(--color-warning),black_25%)]",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "muted" },
  }
)

type StatusTone = NonNullable<VariantProps<typeof statusBadgeVariants>["tone"]>

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  aktiv: "success",
  laufend: "success",
  bezahlt: "success",
  erledigt: "success",
  gekuendigt: "danger",
  gekündigt: "danger",
  storniert: "danger",
  abgelehnt: "danger",
  ausstehend: "warning",
  offen: "warning",
  inbearbeitung: "warning",
  "in bearbeitung": "warning",
  entwurf: "muted",
  inaktiv: "muted",
}

function resolveTone(status: string): StatusTone {
  return STATUS_TONE_MAP[status.trim().toLowerCase()] ?? "muted"
}

function StatusBadge({
  status,
  tone,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  status: string
  tone?: StatusTone
  children?: React.ReactNode
}) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ tone: tone ?? resolveTone(status) }), className)}
      {...props}
    >
      {children ?? status}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants, resolveTone as resolveStatusTone }
