"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, Phone, Mail, Users, ListTodo, CalendarClock, StickyNote } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import { AKTIVITAET_TYPEN, aktivitaetLabel, type AktivitaetTyp } from "@/lib/crm/constants"
import type { DealAktivitaet } from "@/types/crm"

const ICONS: Record<AktivitaetTyp, React.ComponentType<{ className?: string }>> = {
  anruf: Phone,
  email: Mail,
  meeting: Users,
  aufgabe: ListTodo,
  frist: CalendarClock,
  notiz: StickyNote,
}

export function DealAktivitaeten({
  dealId,
  aktivitaeten,
}: {
  dealId: string
  aktivitaeten: DealAktivitaet[]
}) {
  const router = useRouter()
  const [typ, setTyp] = React.useState<AktivitaetTyp>("aufgabe")
  const [titel, setTitel] = React.useState("")
  const [faellig, setFaellig] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!titel.trim()) return
    setBusy(true)
    try {
      const res = await fetch("/api/crm/aktivitaeten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, typ, titel, faellig_am: faellig || null }),
      })
      if (res.ok) {
        setTitel("")
        setFaellig("")
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  async function toggle(a: DealAktivitaet) {
    await fetch(`/api/crm/aktivitaeten/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ erledigt: !a.erledigt }),
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Typ</Label>
          <Select value={typ} onValueChange={(v) => setTyp(v as AktivitaetTyp)}>
            <SelectTrigger className="w-32">
              <SelectValue>{(v) => aktivitaetLabel(String(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AKTIVITAET_TYPEN.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs">Betreff</Label>
          <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Aktivität…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Fällig</Label>
          <Input type="date" value={faellig} onChange={(e) => setFaellig(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} size="sm">
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </form>

      <ul className="flex flex-col divide-y rounded-lg border">
        {aktivitaeten.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">Keine Aktivitäten</li>
        ) : (
          aktivitaeten.map((a) => {
            const Icon = ICONS[a.typ] ?? ListTodo
            const ueberfaellig = !a.erledigt && a.faellig_am && new Date(a.faellig_am) < new Date()
            return (
              <li key={a.id} className="flex items-center gap-3 p-3">
                <button
                  onClick={() => toggle(a)}
                  aria-label="Erledigt umschalten"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    a.erledigt ? "bg-success text-white" : "bg-background"
                  )}
                >
                  {a.erledigt ? <Check className="size-3.5" /> : null}
                </button>
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className={cn("flex-1 text-sm", a.erledigt && "text-muted-foreground line-through")}>
                  {a.titel}
                </span>
                {a.faellig_am ? (
                  <span
                    className={cn(
                      "text-xs",
                      ueberfaellig ? "text-danger" : "text-muted-foreground"
                    )}
                  >
                    {formatDate(a.faellig_am)}
                  </span>
                ) : null}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
