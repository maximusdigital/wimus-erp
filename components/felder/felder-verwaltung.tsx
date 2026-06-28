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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FELDTYPEN, FELD_ENTITAETEN, type FeldEntitaet, type FieldDef } from "@/lib/felder/types"

export function FelderVerwaltung({ defsByEntitaet }: { defsByEntitaet: Record<string, FieldDef[]> }) {
  return (
    <Tabs defaultValue={FELD_ENTITAETEN[0].value}>
      <TabsList className="flex-wrap">
        {FELD_ENTITAETEN.map((e) => (
          <TabsTrigger key={e.value} value={e.value}>
            {e.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FELD_ENTITAETEN.map((e) => (
        <TabsContent key={e.value} value={e.value}>
          <Felder entitaet={e.value} felder={defsByEntitaet[e.value] ?? []} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function Felder({ entitaet, felder }: { entitaet: FeldEntitaet; felder: FieldDef[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ label: "", typ: "text", optionen: "", pflicht: false })

  const brauchtOptionen = form.typ === "auswahl" || form.typ === "mehrfachauswahl"

  async function add() {
    if (!form.label.trim()) {
      setError("Feldname ist Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/felder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entitaet,
        label: form.label,
        typ: form.typ,
        pflicht: form.pflicht,
        optionen: brauchtOptionen
          ? form.optionen.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      }),
    })
    setBusy(false)
    if (res.ok) {
      setOpen(false)
      setForm({ label: "", typ: "text", optionen: "", pflicht: false })
      router.refresh()
    } else {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen.")
    }
  }

  async function del(id: string) {
    const res = await fetch(`/api/felder/${id}`, { method: "DELETE" })
    if (res.ok) router.refresh()
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Feld hinzufügen
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feldname</TableHead>
              <TableHead>Schlüssel</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead className="text-center">Pflicht</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {felder.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Keine Felder
                </TableCell>
              </TableRow>
            ) : (
              felder.map((f) => (
                <TableRow key={f.id} className="group">
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {f.label}
                      {f.geschuetzt ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="size-3" /> System
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{f.key}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {FELDTYPEN.find((t) => t.value === f.typ)?.label ?? f.typ}
                  </TableCell>
                  <TableCell className="text-center">{f.pflicht ? "Ja" : "–"}</TableCell>
                  <TableCell>
                    {f.geschuetzt ? null : (
                      <button
                        onClick={() => del(f.id)}
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
            <DialogTitle>Feld hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>
                Feldname <span className="text-danger">*</span>
              </Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Feldtyp</Label>
              <Select value={form.typ} onValueChange={(v) => setForm({ ...form, typ: v ?? "text" })}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => FELDTYPEN.find((t) => t.value === v)?.label ?? "Text"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FELDTYPEN.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {brauchtOptionen ? (
              <div className="flex flex-col gap-1.5">
                <Label>Optionen (Komma-getrennt)</Label>
                <Input
                  value={form.optionen}
                  onChange={(e) => setForm({ ...form, optionen: e.target.value })}
                  placeholder="z. B. Gold, Silber, Bronze"
                />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setForm({ ...form, pflicht: !form.pflicht })}
              className={
                form.pflicht
                  ? "flex items-center justify-between rounded-md border border-secondary bg-secondary/10 px-3 py-2 text-sm"
                  : "flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              }
            >
              Pflichtfeld
              <span className="text-xs text-muted-foreground">{form.pflicht ? "an" : "aus"}</span>
            </button>
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
