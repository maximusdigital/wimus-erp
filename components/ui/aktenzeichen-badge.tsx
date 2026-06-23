import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * AktenzeichenBadge (Design System 40, Kap. 6.2)
 *
 * Read-only Badge fuer das auto-generierte Aktenzeichen. Steht oben rechts
 * im Header jeder Detailansicht, Monospace-Font, primary-Farbe.
 *
 * Beispiel: <AktenzeichenBadge value="2025IS17A1WH01" />
 */
function AktenzeichenBadge({
  value,
  className,
  ...props
}: React.ComponentProps<"span"> & { value: string | null | undefined }) {
  if (!value) return null

  return (
    <span
      data-slot="aktenzeichen-badge"
      title={`Aktenzeichen ${value}`}
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center rounded-md border border-primary/20 bg-primary/10 px-2 font-mono text-xs font-medium text-primary select-all",
        className
      )}
      {...props}
    >
      {value}
    </span>
  )
}

export { AktenzeichenBadge }
