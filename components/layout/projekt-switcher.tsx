"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban } from "lucide-react"

import { setActiveProjekt } from "@/lib/projekte-actions"
import { useProjekt } from "@/components/providers/projekt-provider"
import { PROJEKT_TYP_LABELS, type Projekt } from "@/types/projekt"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function Dot({ farbe }: { farbe: string | null }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: farbe ?? "var(--muted-foreground)" }}
    />
  )
}

export function ProjektSwitcher() {
  const { projekt, projekte } = useProjekt()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (projekte.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/60">
        <FolderKanban className="size-4" />
        <span className="truncate">Kein Projekt</span>
      </div>
    )
  }

  function onChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await setActiveProjekt(value)
      router.refresh()
    })
  }

  return (
    <Select
      value={projekt?.id ?? undefined}
      onValueChange={onChange}
      disabled={isPending || projekte.length < 2}
    >
      <SelectTrigger
        className="w-full bg-sidebar-accent/40 group-data-[collapsible=icon]:hidden"
        aria-label="Projekt wechseln"
      >
        <SelectValue placeholder="Projekt wählen">
          {(value) => {
            const p =
              projekte.find((x) => x.id === value) ?? projekt ?? null
            if (!p) return "Projekt wählen"
            return (
              <span className="flex items-center gap-2">
                <Dot farbe={p.ci_farbe_primary} />
                {p.name}
              </span>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projekte.map((p: Projekt) => {
          const sub = (p.ebene ?? 0) > 0
          return (
            <SelectItem key={p.id} value={p.id}>
              <span
                className="flex items-center gap-2"
                style={sub ? { paddingLeft: `${(p.ebene ?? 0) * 12}px` } : undefined}
              >
                {sub ? (
                  <span className="text-muted-foreground">↳</span>
                ) : (
                  <Dot farbe={p.ci_farbe_primary} />
                )}
                <span className="truncate">{p.name}</span>
                {p.typ ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {PROJEKT_TYP_LABELS[p.typ] ?? p.typ}
                  </span>
                ) : null}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
