"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CustomFieldDefinition } from "@/types/crm"

/**
 * Rendert die UI-konfigurierten Custom-Fields (Spec 0003). Werte landen unter
 * der Field-ID im custom_values-Objekt.
 */
export function CustomFieldInputs({
  felder,
  values,
  onChange,
}: {
  felder: CustomFieldDefinition[]
  values: Record<string, unknown>
  onChange: (id: string, value: unknown) => void
}) {
  if (felder.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {felder.map((f) => (
        <div key={f.id} className="flex flex-col gap-1.5">
          <Label>
            {f.name}
            {f.pflicht ? <span className="text-danger"> *</span> : null}
            {f.wichtig && !f.pflicht ? (
              <span className="text-warning text-xs"> (wichtig)</span>
            ) : null}
          </Label>
          <FieldControl
            def={f}
            value={values[f.id]}
            onChange={(v) => onChange(f.id, v)}
          />
        </div>
      ))}
    </div>
  )
}

function FieldControl({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}) {
  const str = value == null ? "" : String(value)

  switch (def.feldtyp) {
    case "zahl":
    case "betrag":
      return (
        <Input
          value={str}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      )
    case "datum":
      return <Input type="date" value={str} onChange={(e) => onChange(e.target.value)} />
    case "boolean":
      return (
        <Select value={str || "false"} onValueChange={(v) => onChange(v === "true")}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => (v === "true" ? "Ja" : "Nein")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Ja</SelectItem>
            <SelectItem value="false">Nein</SelectItem>
          </SelectContent>
        </Select>
      )
    case "einzeloption":
      return (
        <Select value={str} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => (v ? String(v) : "Wählen…")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {def.optionen.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    default:
      return <Input value={str} onChange={(e) => onChange(e.target.value)} />
  }
}
