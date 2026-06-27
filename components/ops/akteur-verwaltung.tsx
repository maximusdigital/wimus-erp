"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Bot, User, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
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
import { AKTEUR_TYPEN } from "@/lib/validations/akteur"

export type AkteurRow = {
  id: string
  name: string
  typ: string
  ki_modell: string | null
  bereich: string[] | null
  aktiv: boolean
  kontakt?: { vorname: string | null; nachname: string | null; firmenname: string | null } | null
  organisation?: { name: string } | null
}

const TYP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  mensch: User,
  ki: Bot,
  extern: Building2,
}

export function AkteurVerwaltung({ akteure }: { akteure: AkteurRow[] }) {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [typ, setTyp] = React.useState("mensch")
  const [bereich, setBereich] = React.useState("")
  const [kiModell, setKiModell] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function add() {
    if (!name.trim()) {
      setError("Name ist Pflicht.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/akteure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        typ,
        ki_modell: typ === "ki" ? kiModell || null : null,
        bereich: bereich ? bereich.split(",").map((s) => s.trim()).filter(Boolean) : [],
      }),
    })
    setBusy(false)
    if (res.ok) {
      setName("")
      setBereich("")
      setKiModell("")
      router.refresh()
    } else {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen.")
    }
  }

  async function del(id: string) {
    await fetch(`/api/akteure/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Sabrina / Agent Schaden" className="w-48" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Typ</Label>
          <Select value={typ} onValueChange={(v) => setTyp(v ?? "mensch")}>
            <SelectTrigger className="w-32">
              <SelectValue>{(v) => AKTEUR_TYPEN.find((t) => t.value === v)?.label ?? "Mensch"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AKTEUR_TYPEN.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {typ === "ki" ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">KI-Modell</Label>
            <Input value={kiModell} onChange={(e) => setKiModell(e.target.value)} placeholder="claude-opus-4-8" className="w-40" />
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Bereiche (Komma)</Label>
          <Input value={bereich} onChange={(e) => setBereich(e.target.value)} placeholder="reinigung, handwerk" className="w-44" />
        </div>
        <Button size="sm" onClick={add} disabled={busy}>
          <Plus className="size-4" /> Akteur
        </Button>
        {error ? <span className="text-sm text-danger">{error}</span> : null}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Typ</TableHead>
              <TableHead>Bereiche</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {akteure.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Keine Akteure — Mensch oder KI-Agent oben anlegen.
                </TableCell>
              </TableRow>
            ) : (
              akteure.map((a) => {
                const Icon = TYP_ICON[a.typ] ?? User
                return (
                  <TableRow key={a.id} className="group">
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Icon className="size-4" />
                        {AKTEUR_TYPEN.find((t) => t.value === a.typ)?.label ?? a.typ}
                        {a.ki_modell ? <span className="text-xs">· {a.ki_modell}</span> : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.bereich && a.bereich.length > 0 ? a.bereich.join(", ") : "–"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.aktiv ? "aktiv" : "inaktiv"}>
                        {a.aktiv ? "Aktiv" : "Inaktiv"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => del(a.id)}
                        aria-label="Löschen"
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
