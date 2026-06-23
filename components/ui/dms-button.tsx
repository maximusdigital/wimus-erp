import { FileArchive } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * DmsButton (Design System 40, Kap. 6.2)
 *
 * Paperless-Link Button. Steht immer oben rechts neben der AktenzeichenBadge.
 * Oeffnet das verknuepfte Dokument/die Korrespondenz im DMS (Paperless-ngx).
 *
 * Ohne `href` wird der Button deaktiviert dargestellt (kein DMS-Bezug).
 */
function DmsButton({
  href,
  label = "DMS",
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  href?: string | null
  label?: string
}) {
  if (!href) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        data-slot="dms-button"
        title="Kein DMS-Dokument verknuepft"
        className={cn(className)}
        {...props}
      >
        <FileArchive />
        {label}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      data-slot="dms-button"
      title="Im DMS (Paperless) oeffnen"
      className={cn(className)}
      render={
        <a href={href} target="_blank" rel="noopener noreferrer">
          <FileArchive />
          {label}
        </a>
      }
      {...props}
    />
  )
}

export { DmsButton }
