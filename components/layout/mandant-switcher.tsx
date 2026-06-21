"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

import { setActiveMandant } from "@/lib/mandanten-actions"
import { useMandant } from "@/components/providers/mandant-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function MandantSwitcher() {
  const { mandant, mandanten } = useMandant()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (mandanten.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/60">
        <Building2 className="size-4" />
        <span className="truncate">Kein Mandant</span>
      </div>
    )
  }

  function onChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await setActiveMandant(value)
      router.refresh()
    })
  }

  return (
    <Select
      value={mandant?.id ?? undefined}
      onValueChange={onChange}
      disabled={isPending || mandanten.length < 2}
    >
      <SelectTrigger
        className="w-full bg-sidebar-accent/40 group-data-[collapsible=icon]:hidden"
        aria-label="Mandant wechseln"
      >
        <SelectValue placeholder="Mandant wählen" />
      </SelectTrigger>
      <SelectContent>
        {mandanten.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: m.farbe ?? "var(--muted-foreground)" }}
              />
              {m.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
