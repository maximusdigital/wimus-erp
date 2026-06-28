"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Lock, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { KontaktTyp } from "@/lib/felder/types"

const DIMENSIONEN = [
  { value: "person", label: "Person" },
  { value: "organisation", label: "Organisation" },
] as const

export function KontakttypenVerwaltung({ typen }: { typen: KontaktTyp[] }) {
  return (
    <Tabs defaultValue="person">
      <TabsList>
        {DIMENSIONEN.map((d) => (
          <TabsTrigger key={d.value} value={d.value}>
            {d.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {DIMENSIONEN.map((d) => (
        <TabsContent key={d.value} value={d.value}>
          <Typen giltFuer={d.value} typen={typen.filter((t) => t.gilt_fuer === d.value)} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function Typen({
  giltFuer,
  typen,
}: {
  giltFuer: "person" | "organisation"
  typen: KontaktTyp[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [label, setLabel] = React.useState("")

  async function add() {
    if (!label.trim()) {
      setError("Bezeichnung ist Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/kontakttypen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gilt_fuer: giltFuer, label }),
    })
    setBusy(false)
    if (res.ok) {
      setOpen(false)
      setLabel("")
      router.refresh()
    } else {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen.")
    }
  }

  async function del(id: string) {
    const res = await fetch(`/api/kontakttypen/${id}`, { method: "DELETE" })
    if (res.ok) router.refresh()
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Typ hinzufügen
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bezeichnung</TableHead>
              <TableHead>Schlüssel</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {typen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                  Keine Typen
                </TableCell>
              </TableRow>
            ) : (
              typen.map((t) => (
                <TableRow key={t.id} className="group">
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {t.label}
                      {t.geschuetzt ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="size-3" /> System
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.typ_key}</TableCell>
                  <TableCell>
                    {t.geschuetzt ? null : (
                      <button
                        onClick={() => del(t.id)}
                        aria-label="Löschen"
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
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
            <DialogTitle>Typ hinzufügen ({giltFuer === "person" ? "Person" : "Organisation"})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>
                Bezeichnung <span className="text-danger">*</span>
              </Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
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
