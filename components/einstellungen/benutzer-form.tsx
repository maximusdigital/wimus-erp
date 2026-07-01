"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
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

export type BenutzerEdit = {
  id: string
  email: string | null
  vorname: string | null
  nachname: string | null
  aktiv: boolean | null
}

/**
 * Benutzer bearbeiten (Modul 010, Stufe 0): vorname/nachname + Aktiv-Status.
 * E-Mail read-only (Login-Identität), Rollen NUR anzeigen (Vergabe = Stufe 1).
 * Anti-Lockout: Selbst-Deaktivierung ist gesperrt. Deaktivieren nur mit Confirm.
 */
export function BenutzerForm({
  benutzer,
  rollen,
  istSelbst,
}: {
  benutzer: BenutzerEdit
  rollen: string[]
  istSelbst: boolean
}) {
  const router = useRouter()
  const [vorname, setVorname] = useState(benutzer.vorname ?? "")
  const [nachname, setNachname] = useState(benutzer.nachname ?? "")
  const [aktiv, setAktiv] = useState(benutzer.aktiv !== false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const anzeigeName = [vorname, nachname].filter(Boolean).join(" ") || benutzer.email || "Benutzer"

  async function speichere(patch: Record<string, unknown>): Promise<boolean> {
    setLoading(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch(`/api/benutzer/${benutzer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? "Speichern fehlgeschlagen.")
        return false
      }
      setOk(true)
      router.refresh()
      return true
    } catch {
      setError("Netzwerkfehler beim Speichern.")
      return false
    } finally {
      setLoading(false)
    }
  }

  async function onDeaktivieren() {
    const done = await speichere({ aktiv: false })
    if (done) {
      setAktiv(false)
      setDialogOpen(false)
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      {/* Stammdaten */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="vorname" className="block text-sm font-medium">
            Vorname
          </label>
          <Input id="vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label htmlFor="nachname" className="block text-sm font-medium">
            Nachname
          </label>
          <Input id="nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">E-Mail (Login)</label>
        <Input value={benutzer.email ?? ""} readOnly disabled />
        <p className="text-xs text-muted-foreground">Login-Identität — nicht änderbar.</p>
      </div>

      <div className="space-y-1">
        <span className="block text-sm font-medium">Rollen</span>
        <div className="flex flex-wrap gap-1">
          {rollen.length > 0 ? (
            rollen.map((r) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Keine Rollen zugewiesen.</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Rollen-Vergabe folgt in Stufe 1.</p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {ok ? <p className="text-sm text-success">Gespeichert.</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => speichere({ vorname, nachname })} disabled={loading}>
          {loading ? "Speichert…" : "Stammdaten speichern"}
        </Button>

        {/* Aktiv-Status */}
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={aktiv ? "aktiv" : "inaktiv"}>{aktiv ? "Aktiv" : "Inaktiv"}</StatusBadge>
          {aktiv ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="destructive" disabled={istSelbst || loading}>
                    Deaktivieren
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Benutzer deaktivieren?</DialogTitle>
                  <DialogDescription>
                    Benutzer <strong>{anzeigeName}</strong> deaktivieren? Er/sie kann sich dann nicht
                    mehr anmelden. Die Rollen bleiben erhalten und können später wieder aktiviert werden.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
                  <Button variant="destructive" onClick={onDeaktivieren} disabled={loading}>
                    {loading ? "Deaktivieren…" : "Ja, deaktivieren"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" onClick={() => speichere({ aktiv: true }).then((d) => d && setAktiv(true))} disabled={loading}>
              Aktivieren
            </Button>
          )}
        </div>
      </div>
      {istSelbst ? (
        <p className="text-xs text-muted-foreground">
          Du kannst dich nicht selbst deaktivieren (Anti-Lockout).
        </p>
      ) : null}
    </div>
  )
}
