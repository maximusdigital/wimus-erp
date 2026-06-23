"use client"

import { Label } from "@/components/ui/label"
import {
  MultiSelectList,
  type MultiSelectOption,
} from "@/components/shared/multi-select-list"

/**
 * Beziehungs-Zuordnung als beschriftete Mehrfachauswahl.
 * Wird in den Stammdaten-Masken für 1:N-Beziehungen verwendet
 * (z. B. Objekt → Einheiten, Objekt/Einheit/Kontakt → Verträge).
 */
export function ZuordnungFeld({
  label,
  options,
  value,
  onChange,
  beschreibung,
  emptyText,
}: {
  label: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  beschreibung?: string
  emptyText?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <MultiSelectList
        options={options}
        value={value}
        onChange={onChange}
        emptyText={emptyText}
      />
      {beschreibung ? (
        <p className="text-muted-foreground text-xs">{beschreibung}</p>
      ) : null}
    </div>
  )
}
