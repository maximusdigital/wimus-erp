"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Printer, Save } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AbrechnungAktionen({
  abrechnungseinheitId,
  period,
  disabled,
}: {
  abrechnungseinheitId: string
  period?: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const druckHref = `/betriebskosten/${abrechnungseinheitId}/abrechnung/druck${
    period ? `?period=${period}` : ""
  }`

  async function speichern() {
    setSaving(true)
    setMsg(null)
    const res = await fetch(
      `/api/betriebskosten/${abrechnungseinheitId}/abrechnung`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      }
    )
    const j = await res.json().catch(() => null)
    setSaving(false)
    if (!res.ok) {
      setMsg({ ok: false, text: j?.error ?? "Speichern fehlgeschlagen" })
      return
    }
    setMsg({ ok: true, text: `${j.anzahl} Abrechnung(en) gespeichert.` })
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="outline" render={<Link href={druckHref} />}>
          <Printer />
          <span>Drucken</span>
        </Button>
        <Button onClick={speichern} disabled={saving || disabled}>
          <Save />
          <span>{saving ? "Speichert…" : "Abrechnung speichern"}</span>
        </Button>
      </div>
      {msg ? (
        <p className={msg.ok ? "text-sm text-success" : "text-sm text-danger"}>
          {msg.text}
        </p>
      ) : null}
    </div>
  )
}
