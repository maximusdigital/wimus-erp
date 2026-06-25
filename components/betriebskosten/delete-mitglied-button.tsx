"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DeleteMitgliedButton({
  abrechnungseinheitId,
  mitgliedId,
}: {
  abrechnungseinheitId: string
  mitgliedId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    setLoading(true)
    const res = await fetch(
      `/api/abrechnungseinheiten/${abrechnungseinheitId}/mitglieder/${mitgliedId}`,
      { method: "DELETE" }
    )
    if (!res.ok && res.status !== 204) {
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={loading}
      aria-label="Mitglied entfernen"
    >
      <Trash2 className="size-4" />
    </Button>
  )
}
