import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * PriorityBadge (Design System 40, Kap. 6.2)
 *
 * Vorgang-Prioritaet:
 *   notfall -> danger + pulsierend
 *   hoch    -> danger
 *   normal  -> secondary
 *   niedrig -> muted
 */
const priorityBadgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap capitalize",
  {
    variants: {
      prioritaet: {
        notfall: "bg-danger text-danger-foreground animate-pulse",
        hoch: "bg-danger/10 text-danger",
        normal: "bg-secondary/10 text-secondary",
        niedrig: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { prioritaet: "normal" },
  }
)

type Prioritaet = NonNullable<VariantProps<typeof priorityBadgeVariants>["prioritaet"]>

const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  notfall: "Notfall",
  hoch: "Hoch",
  normal: "Normal",
  niedrig: "Niedrig",
}

function normalize(value: string): Prioritaet {
  const v = value.trim().toLowerCase()
  // Kanonisch ist "notfall" (DB-CHECK + Spec). "kritisch" bleibt als Legacy-Alias
  // toleriert, falls noch irgendwo alte Werte auftauchen.
  if (v === "notfall" || v === "kritisch") return "notfall"
  if (v === "hoch" || v === "normal" || v === "niedrig") return v
  return "normal"
}

function PriorityBadge({
  prioritaet,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  prioritaet: string
  children?: React.ReactNode
}) {
  const p = normalize(prioritaet)
  return (
    <span
      data-slot="priority-badge"
      className={cn(priorityBadgeVariants({ prioritaet: p }), className)}
      {...props}
    >
      {children ?? PRIORITAET_LABEL[p]}
    </span>
  )
}

export { PriorityBadge, priorityBadgeVariants }
