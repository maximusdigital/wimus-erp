"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import type { PositionArt } from "@/lib/fibu/taxonomie"

export type TaxonomieRow = {
  id: string
  position_code: string
  bezeichnung: string
  mapping: { art: PositionArt; konten: string[] }
}

const ART_LABEL: Record<PositionArt, string> = {
  ertrag: "Ertrag",
  aufwand: "Aufwand",
  neutral: "Neutral",
}
const ART_TONE: Record<PositionArt, "success" | "danger" | "muted"> = {
  ertrag: "success",
  aufwand: "danger",
  neutral: "muted",
}

export function TaxonomieVerwaltung({ positionen }: { positionen: TaxonomieRow[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ position_code: "", bezeichnung: "", art: "aufwand", konten: "" })

  async function add() {
    if (!form.position_code.trim() || !form.bezeichnung.trim()) {
      setError("Code und Bezeichnung sind Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/fibu/reporting-taxonomie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        position_code: form.position_code,
        bezeichnung: form.bezeichnung,
        art: form.art,
        konten: form.konten.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    })
    setBusy(false)
    if (res.ok) {
      setForm({ position_code: "", bezeichnung: "", art: "aufwand", konten: "" })
      setOpen(false)
      router.refresh()
    } else {
      const j = await res.json().catch(() => null)
      setError(res.status === 409 ? "Position-Code existiert bereits." : j?.error ?? "Fehlgeschlagen.")
    }
  }

  async function del(id: string) {
    await fetch(`/api/fibu/reporting-taxonomie/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Position hinzufügen
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Code</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead className="w-24">Art</TableHead>
              <TableHead>Konten (Präfixe)</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {positionen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Keine Berichtspositionen — lege z. B. „Mieterträge" (Ertrag, 8) oder
                  „Instandhaltung" (Aufwand, 4260) an.
                </TableCell>
              </TableRow>
            ) : (
              positionen.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-medium tabular-nums">{p.position_code}</TableCell>
                  <TableCell>{p.bezeichnung}</TableCell>
                  <TableCell>
                    <StatusBadge status="" tone={ART_TONE[p.mapping.art]}>
                      {ART_LABEL[p.mapping.art]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.mapping.konten.map((k) => (
                        <span key={k} className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                          {k}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => del(p.id)}
                      aria-label="Löschen"
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Berichtsposition hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Code <span className="text-danger">*</span></Label>
                <Input
                  value={form.position_code}
                  onChange={(e) => setForm({ ...form, position_code: e.target.value })}
                  placeholder="E1"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Bezeichnung <span className="text-danger">*</span></Label>
                <Input
                  value={form.bezeichnung}
                  onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })}
                  placeholder="Mieterträge"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Art</Label>
              <Select value={form.art} onValueChange={(v) => setForm({ ...form, art: v ?? "aufwand" })}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => ART_LABEL[(v as PositionArt) ?? "aufwand"]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ertrag">Ertrag</SelectItem>
                  <SelectItem value="aufwand">Aufwand</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Konten / Präfixe (Komma-getrennt)</Label>
              <Input
                value={form.konten}
                onChange={(e) => setForm({ ...form, konten: e.target.value })}
                placeholder="z. B. 8 oder 4260, 4261"
              />
              <p className="text-xs text-muted-foreground">
                Präfix-Match: „8" trifft alle 8xxx, „4260" nur dieses Konto. Längster Präfix gewinnt.
              </p>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
            <Button onClick={add} disabled={busy}>
              {busy ? "…" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
