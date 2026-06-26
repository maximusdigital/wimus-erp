"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FileUp, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Liest eine Datei als Data-URL (base64) ein. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

export function BelegUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function senden(payload: { dataUrl?: string; content?: string }) {
    setLoading(true)
    setMsg(null)
    setError(null)
    const res = await fetch("/api/fibu/belege", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Verarbeitung fehlgeschlagen")
      return
    }
    const beleg = await res.json().catch(() => null)
    setMsg(
      `Erkannt: ${beleg?.lieferant_name ?? "?"} · ${beleg?.brutto ?? "?"} € · ${
        beleg?.status === "gebucht" ? "automatisch gebucht" : "Freigabe offen"
      }`
    )
    router.refresh()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readAsDataUrl(file)
      // XML/E-Rechnung als Text senden (deterministischer Parse, kein OCR).
      if (/\.xml$/i.test(file.name) || file.type.includes("xml")) {
        const text = await file.text()
        await senden({ content: text })
      } else {
        await senden({ dataUrl })
      }
    } catch {
      setError("Datei konnte nicht gelesen werden.")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? <Loader2 className="animate-spin" /> : <FileUp />}
          <span>{loading ? "Erkenne Beleg…" : "Beleg hochladen (PDF/Bild/XML)"}</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.xml,application/pdf,image/*,application/xml,text/xml"
          className="hidden"
          onChange={onFile}
        />
        <p className="text-muted-foreground text-xs">
          E-Rechnung (ZUGFeRD/XRechnung) wird ohne OCR exakt geparst; Scans via
          Mistral-OCR + KI-Extraktion. Kontierung & Validierung deterministisch.
        </p>
      </div>
      {msg ? <p className="mt-2 text-sm text-success">{msg}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  )
}
