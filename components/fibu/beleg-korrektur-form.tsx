"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FirmaOption } from "@/components/fibu/beteiligung-form"
import type { Beleg } from "@/types/beleg"

const KEINE = "__keine__"

type Feld = { name: keyof Beleg; label: string; type?: string }

const FELDER: Feld[] = [
  { name: "belegnummer", label: "Belegnummer" },
  { name: "belegdatum", label: "Belegdatum", type: "date" },
  { name: "lieferant_name", label: "Lieferant" },
  { name: "netto", label: "Netto", type: "number" },
  { name: "ust_betrag", label: "USt-Betrag", type: "number" },
  { name: "ust_satz", label: "USt-Satz %", type: "number" },
  { name: "brutto", label: "Brutto", type: "number" },
  { name: "soll_konto", label: "Soll-Konto" },
  { name: "steuerschluessel", label: "Steuerschlüssel" },
  { name: "k1", label: "K1 (Objekt)" },
  { name: "k2", label: "K2" },
]

export function BelegKorrekturForm({
  beleg,
  firmen,
}: {
  beleg: Beleg
  firmen: FirmaOption[]
}) {
  const router = useRouter()
  const [werte, setWerte] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    for (const f of FELDER) {
      const v = beleg[f.name]
      o[f.name as string] = v == null ? "" : String(v)
    }
    o.firma_id = beleg.firma_id ?? ""
    return o
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function set(name: string, value: string) {
    setWerte((w) => ({ ...w, [name]: value }))
  }

  async function speichern() {
    setSaving(true)
    setMsg(null)
    setError(null)
    const body: Record<string, unknown> = {}
    for (const f of FELDER) {
      const raw = werte[f.name as string]
      body[f.name as string] =
        raw === "" ? null : f.type === "number" ? Number(raw) : raw
    }
    body.firma_id = werte.firma_id === KEINE || werte.firma_id === "" ? null : werte.firma_id

    const res = await fetch(`/api/fibu/belege/${beleg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen")
      return
    }
    setMsg("Gespeichert – Korrekturen protokolliert.")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-sm font-medium">
            Firma (Buchungskreis)
          </label>
          <Select
            value={werte.firma_id || KEINE}
            onValueChange={(v) => set("firma_id", v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v) =>
                  !v || v === KEINE
                    ? "— nicht zugeordnet —"
                    : (firmen.find((f) => f.id === v)?.name ?? "—")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KEINE}>— nicht zugeordnet —</SelectItem>
              {firmen.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {FELDER.map((f) => (
          <div key={f.name as string}>
            <label className="mb-1 block text-sm font-medium">{f.label}</label>
            <Input
              type={f.type === "number" ? "text" : f.type ?? "text"}
              inputMode={f.type === "number" ? "decimal" : undefined}
              value={werte[f.name as string]}
              onChange={(e) => set(f.name as string, e.target.value)}
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-danger text-sm">{error}</p> : null}
      {msg ? <p className="text-success text-sm">{msg}</p> : null}

      <div className="flex justify-end border-t pt-4">
        <Button onClick={speichern} disabled={saving}>
          {saving ? "Speichern…" : "Korrektur speichern"}
        </Button>
      </div>
    </div>
  )
}
