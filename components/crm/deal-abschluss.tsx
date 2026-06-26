"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, X, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DealStatus, VerlorenGrund } from "@/types/crm"

export function DealAbschluss({
  dealId,
  status,
  verlorenGruende,
}: {
  dealId: string
  status: DealStatus
  verlorenGruende: VerlorenGrund[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [grundId, setGrundId] = React.useState(verlorenGruende[0]?.id ?? "")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function abschliessen(neu: "gewonnen" | "verloren", verlorenGrundId?: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/abschluss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: neu, verloren_grund_id: verlorenGrundId ?? null }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Abschluss fehlgeschlagen.")
        return
      }
      setOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function reaktivieren() {
    setBusy(true)
    try {
      await fetch(`/api/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "offen", verloren_grund_id: null, abgeschlossen_am: null }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (status !== "offen") {
    return (
      <div className="flex items-center gap-2">
        <span
          className={
            status === "gewonnen"
              ? "rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success"
              : "rounded-full bg-danger/10 px-3 py-1 text-sm font-medium text-danger"
          }
        >
          {status === "gewonnen" ? "Gewonnen" : "Verloren"}
        </span>
        <Button size="sm" variant="ghost" onClick={reaktivieren} disabled={busy}>
          <RotateCcw className="size-4" /> Reaktivieren
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-success text-white hover:bg-success/90"
        onClick={() => abschliessen("gewonnen")}
        disabled={busy}
      >
        <Check className="size-4" /> Gewonnen
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)} disabled={busy}>
        <X className="size-4" /> Verloren
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deal als verloren markieren</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>
              Grund <span className="text-danger">*</span>
            </Label>
            <Select value={grundId} onValueChange={(v) => setGrundId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v) => verlorenGruende.find((g) => g.id === v)?.bezeichnung ?? "Wählen…"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {verlorenGruende.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.bezeichnung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
            <Button
              variant="destructive"
              onClick={() => abschliessen("verloren", grundId)}
              disabled={busy || !grundId}
            >
              {busy ? "…" : "Verloren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
