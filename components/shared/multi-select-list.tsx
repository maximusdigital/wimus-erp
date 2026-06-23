"use client"

import { Check, Lock } from "lucide-react"

import { cn } from "@/lib/utils"

export type MultiSelectOption = {
  value: string
  label: string
  hint?: string
  /** Immer ausgewählt, kann nicht abgewählt werden (z. B. Pflicht-Beziehung). */
  locked?: boolean
}

/**
 * Schlanke Mehrfachauswahl als anklickbare Checkbox-Liste.
 * Kein Popover/Command nötig – funktioniert mobil wie am Desktop.
 */
export function MultiSelectList({
  options,
  value,
  onChange,
  emptyText = "Keine Einträge vorhanden.",
}: {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  emptyText?: string
}) {
  function toggle(option: MultiSelectOption) {
    if (option.locked) return
    onChange(
      value.includes(option.value)
        ? value.filter((v) => v !== option.value)
        : [...value, option.value]
    )
  }

  if (options.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded-lg border">
      <ul className="divide-y">
        {options.map((o) => {
          const selected = value.includes(o.value) || Boolean(o.locked)
          return (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => toggle(o)}
                aria-pressed={selected}
                disabled={o.locked}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                  o.locked && "cursor-default hover:bg-transparent"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {selected ? <Check className="size-3.5" /> : null}
                </span>
                <span className="flex-1">
                  <span className="font-medium">{o.label}</span>
                  {o.hint ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {o.hint}
                    </span>
                  ) : null}
                </span>
                {o.locked ? (
                  <Lock className="text-muted-foreground size-3.5" />
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
