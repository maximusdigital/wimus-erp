"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteForderungButton({
  id,
  label,
}: {
  id: string
  label: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onDelete() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/forderungen/${id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? "Löschen fehlgeschlagen.")
      setLoading(false)
      return
    }
    setOpen(false)
    router.push("/finanzen/forderungen")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive">
            <Trash2 />
            <span>Löschen</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forderung löschen?</DialogTitle>
          <DialogDescription>
            Forderung <strong>{label}</strong> wird dauerhaft gelöscht. Das kann
            nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            {loading ? "Löschen…" : "Endgültig löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
