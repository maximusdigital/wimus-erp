"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DeleteBeteiligungButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    setLoading(true)
    const res = await fetch(`/api/fibu/beteiligungen/${id}`, {
      method: "DELETE",
    })
    if (res.ok || res.status === 204) {
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={loading}
      aria-label="Beteiligung löschen"
    >
      <Trash2 className="text-danger" />
    </Button>
  )
}
