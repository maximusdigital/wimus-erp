"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Gavel } from "lucide-react"

import { Button } from "@/components/ui/button"

export function MahnungErstellenButton({
  forderungId,
  stufeLabel,
}: {
  forderungId: string
  stufeLabel: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/forderungen/${forderungId}/mahnung`, {
      method: "POST",
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? "Mahnung konnte nicht erstellt werden.")
      setLoading(false)
      return
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={onClick} disabled={loading}>
        <Gavel />
        <span>{loading ? "Erstelle…" : stufeLabel}</span>
      </Button>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  )
}
