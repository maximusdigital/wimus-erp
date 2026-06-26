"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, Trash2 } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FELDTYPEN } from "@/lib/crm/constants"
import type { CustomFieldDefinition } from "@/types/crm"

export function DatenfeldVerwaltung({ felder }: { felder: CustomFieldDefinition[] }) {
  return (
    <Tabs defaultValue="deal">
      <TabsList>
        <TabsTrigger value="deal">Deal</TabsTrigger>
        <TabsTrigger value="lead">Lead</TabsTrigger>
      </TabsList>
      <TabsContent value="deal">
        <Felder entitaet="deal" felder={felder.filter((f) => f.entitaet === "deal")} />
      </TabsContent>
      <TabsContent value="lead">
        <Felder entitaet="lead" felder={felder.filter((f) => f.entitaet === "lead")} />
      </TabsContent>
    </Tabs>
  )
}

function Felder({
  entitaet,
  felder,
}: {
  entitaet: "deal" | "lead"
  felder: CustomFieldDefinition[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    name: "",
    feldtyp: "text",
    optionen: "",
    anzeige_hinzufuegen: true,
    anzeige_detail: true,
    pflicht: false,
    wichtig: false,
  })

  async function add() {
    if (!form.name.trim()) {
      setError("Name ist Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/crm/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entitaet,
        name: form.name,
        feldtyp: form.feldtyp,
        optionen: form.optionen
          ? form.optionen.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        anzeige_hinzufuegen: form.anzeige_hinzufuegen,
        anzeige_detail: form.anzeige_detail,
        pflicht: form.pflicht,
        wichtig: form.wichtig,
      }),
    })
    setBusy(false)
    if (res.ok) {
      setOpen(false)
      setForm({
        name: "",
        feldtyp: "text",
        optionen: "",
        anzeige_hinzufuegen: true,
        anzeige_detail: true,
        pflicht: false,
        wichtig: false,
      })
      router.refresh()
    } else {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen.")
    }
  }

  async function del(id: string) {
    await fetch(`/api/crm/custom-fields/${id}`, { method: "DELETE" })
    router.refresh()
  }

  const brauchtOptionen = form.feldtyp === "einzeloption" || form.feldtyp === "mehrfachoption"

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
              <TableHead>Name</TableHead>
              <TableHead>Feldtyp</TableHead>
              <TableHead className="text-center">Neu-Formular</TableHead>
              <TableHead className="text-center">Detail</TableHead>
              <TableHead className="text-center">Pflicht</TableHead>
              <TableHead className="text-center">Wichtig</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {felder.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  Keine Datenfelder
                </TableCell>
              </TableRow>
            ) : (
              felder.map((f) => (
                <TableRow key={f.id} className="group">
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {FELDTYPEN.find((t) => t.value === f.feldtyp)?.label ?? f.feldtyp}
                  </TableCell>
                  <Cell on={f.anzeige_hinzufuegen} />
                  <Cell on={f.anzeige_detail} />
                  <Cell on={f.pflicht} />
                  <Cell on={f.wichtig} />
                  <TableCell>
                    <button
                      onClick={() => del(f.id)}
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
            <DialogTitle>Feld hinzufügen ({entitaet})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>
                Feldname <span className="text-danger">*</span>
              </Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Feldtyp</Label>
              <Select value={form.feldtyp} onValueChange={(v) => setForm({ ...form, feldtyp: v ?? "text" })}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v) => FELDTYPEN.find((t) => t.value === v)?.label ?? "Text"}
                  </SelectValue>
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
                  placeholder="z. B. Klein, Mittel, Groß"
                />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Toggle
                label="Im Neu-Formular"
                on={form.anzeige_hinzufuegen}
                onClick={() => setForm({ ...form, anzeige_hinzufuegen: !form.anzeige_hinzufuegen })}
              />
              <Toggle
                label="In Detailansicht"
                on={form.anzeige_detail}
                onClick={() => setForm({ ...form, anzeige_detail: !form.anzeige_detail })}
              />
              <Toggle
                label="Erforderlich"
                on={form.pflicht}
                onClick={() => setForm({ ...form, pflicht: !form.pflicht })}
              />
              <Toggle
                label="Wichtig"
                on={form.wichtig}
                onClick={() => setForm({ ...form, wichtig: !form.wichtig })}
              />
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

function Cell({ on }: { on: boolean }) {
  return (
    <TableCell className="text-center">
      {on ? <Check className="mx-auto size-4 text-success" /> : <span className="text-muted-foreground">–</span>}
    </TableCell>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        on
          ? "flex items-center justify-between rounded-md border border-secondary bg-secondary/10 px-3 py-2 text-sm"
          : "flex items-center justify-between rounded-md border px-3 py-2 text-sm"
      }
    >
      {label}
      {on ? <Check className="size-4 text-secondary" /> : null}
    </button>
  )
}
