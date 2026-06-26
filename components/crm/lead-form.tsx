"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_QUELLEN } from "@/lib/crm/constants"

export function LeadForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: "",
    quelle: "manuell",
    kontaktdaten: "",
    anfrage_text: "",
  })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "Speichern fehlgeschlagen.")
        return
      }
      router.push("/crm/leads")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-[640px] flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>
          Name / Betreff <span className="text-danger">*</span>
        </Label>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="z. B. Anfrage WG-Zimmer Bauhofstraße"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Quelle</Label>
        <Select value={form.quelle} onValueChange={(v) => set("quelle", v ?? "manuell")}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v) => LEAD_QUELLEN.find((q) => q.value === v)?.label ?? "Manuell"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEAD_QUELLEN.map((q) => (
              <SelectItem key={q.value} value={q.value}>
                {q.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Kontaktdaten</Label>
        <Input
          value={form.kontaktdaten}
          onChange={(e) => set("kontaktdaten", e.target.value)}
          placeholder="E-Mail / Telefon"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Anfrage-Text</Label>
        <Textarea
          value={form.anfrage_text}
          onChange={(e) => set("anfrage_text", e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/crm/leads")}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "Lead anlegen"}
        </Button>
      </div>
    </form>
  )
}
