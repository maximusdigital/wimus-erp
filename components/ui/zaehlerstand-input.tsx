"use client"

import { Camera } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * ZaehlerstandInput (Design System 40, Kap. 6.2)
 *
 * Erfassung eines Zaehlerstands: Wert + Einheit + Foto-Upload +
 * Ableseart-Select + ist_schaetzwert Toggle. Kontrolliert.
 *
 * Datenmodell v5: zaehlerstaende (wert, ableseart, ist_schaetzwert).
 */
export type Ableseart = "ablesung" | "schaetzung" | "online" | "rechnung"

const ABLESEART_LABEL: Record<Ableseart, string> = {
  ablesung: "Ablesung",
  schaetzung: "Schaetzung",
  online: "Online (Smart Meter)",
  rechnung: "Aus Rechnung",
}

function ZaehlerstandInput({
  value,
  onValueChange,
  einheit = "kWh",
  ableseart = "ablesung",
  onAbleseartChange,
  istSchaetzwert = false,
  onIstSchaetzwertChange,
  onFoto,
  hasFoto = false,
  id = "zaehlerstand",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value: string | number | null | undefined
  onValueChange?: (value: string) => void
  einheit?: string
  ableseart?: Ableseart
  onAbleseartChange?: (value: Ableseart) => void
  istSchaetzwert?: boolean
  onIstSchaetzwertChange?: (value: boolean) => void
  onFoto?: () => void
  hasFoto?: boolean
}) {
  return (
    <div
      data-slot="zaehlerstand-input"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} className="text-sm font-medium">
            Zaehlerstand <span className="text-danger">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              step="any"
              value={value ?? ""}
              onChange={(e) => onValueChange?.(e.target.value)}
              className="flex-1"
            />
            <span className="shrink-0 text-sm text-muted-foreground">{einheit}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-ableseart`} className="text-sm font-medium">
            Ableseart
          </Label>
          <Select
            value={ableseart}
            onValueChange={(v) => onAbleseartChange?.(v as Ableseart)}
          >
            <SelectTrigger id={`${id}-ableseart`} className="w-full">
              <SelectValue placeholder="Auswaehlen…" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ABLESEART_LABEL) as Ableseart[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {ABLESEART_LABEL[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={istSchaetzwert}
            onChange={(e) => onIstSchaetzwertChange?.(e.target.checked)}
            className="size-4 accent-warning"
          />
          <span className={cn(istSchaetzwert && "font-medium text-warning")}>
            Schaetzwert
          </span>
        </label>

        {onFoto ? (
          <Button
            type="button"
            variant={hasFoto ? "secondary" : "outline"}
            size="sm"
            onClick={onFoto}
          >
            <Camera className="size-4" />
            {hasFoto ? "Foto ersetzen" : "Foto"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export { ZaehlerstandInput }
