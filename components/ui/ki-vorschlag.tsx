"use client"

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * KiVorschlag (Design System 40, Kap. 5.1 + 6.2)
 *
 * Inline-KI-Vorschlag direkt unter einem Formularfeld:
 * bg-secondary/10, klar als Vorschlag erkennbar, mit
 * "Uebernehmen" / "Ignorieren" Buttons.
 *
 * Beispiel:
 *   <KiVorschlag vorschlag="BHS16W3Z1"
 *                onUebernehmen={() => setValue("vz", "BHS16W3Z1")}
 *                onIgnorieren={() => setHidden(true)} />
 */
function KiVorschlag({
  vorschlag,
  label = "KI-Vorschlag",
  onUebernehmen,
  onIgnorieren,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onError"> & {
  vorschlag: React.ReactNode
  label?: string
  onUebernehmen?: () => void
  onIgnorieren?: () => void
}) {
  return (
    <div
      data-slot="ki-vorschlag"
      className={cn(
        "mt-1 flex flex-col gap-2 rounded-md bg-secondary/10 p-2 text-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-secondary">
        <Sparkles className="size-3.5 shrink-0" />
        <span className="text-xs font-medium">{label}:</span>
        <span className="truncate font-medium text-foreground">{vorschlag}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        {onUebernehmen ? (
          <Button type="button" size="xs" variant="secondary" onClick={onUebernehmen}>
            Uebernehmen
          </Button>
        ) : null}
        {onIgnorieren ? (
          <Button type="button" size="xs" variant="ghost" onClick={onIgnorieren}>
            Ignorieren
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export { KiVorschlag }
