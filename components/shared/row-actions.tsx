"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type RowAction = {
  label: string
  icon?: LucideIcon
  href?: string
  onClick?: () => void
}

/** Destruktive Aktion; `kind` steuert Wortwahl (Datenintegrität/GoBD). */
export type RowDestructive = {
  kind: "hard" | "soft" | "storno"
  label?: string
  description?: string
  /** Entweder eine DELETE-URL (REST) ODER ein eigener Callback. */
  deleteUrl?: string
  onConfirm?: () => void | Promise<void>
}

const DESTRUCTIVE_WORT: Record<RowDestructive["kind"], string> = {
  hard: "Löschen",
  soft: "Archivieren",
  storno: "Stornieren",
}

function stop(e: React.MouseEvent) {
  e.stopPropagation()
}

function ActionIcon({ action }: { action: RowAction }) {
  const Icon = action.icon ?? Pencil
  if (action.href) {
    return (
      <Button
        size="icon"
        variant="ghost"
        render={<Link href={action.href} onClick={stop} aria-label={action.label} />}
        title={action.label}
      >
        <Icon />
      </Button>
    )
  }
  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={action.label}
      title={action.label}
      onClick={(e) => {
        stop(e)
        action.onClick?.()
      }}
    >
      <Icon />
    </Button>
  )
}

/**
 * Wiederverwendbare Zeilen-Aktionen (Spec 0001/40_design „UI-Konventionen").
 * Dreistufig: Primär-Icons (Bearbeiten + 1 Kontextaktion) · Kebab (sekundär) ·
 * destruktiv (rot, unten, mit Bestätigung). Klicks stoppen die Propagation,
 * damit der Row-Klick → Detail erhalten bleibt.
 */
export function RowActions({
  editHref,
  primary,
  secondary = [],
  destructive,
}: {
  editHref?: string
  primary?: RowAction
  secondary?: RowAction[]
  destructive?: RowDestructive
}) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const hatKebab = secondary.length > 0 || !!destructive

  async function runDestructive() {
    if (!destructive) return
    setBusy(true)
    setError(null)
    try {
      if (destructive.deleteUrl) {
        const res = await fetch(destructive.deleteUrl, { method: "DELETE" })
        if (!res.ok && res.status !== 204) {
          const j = await res.json().catch(() => null)
          setError(j?.error ?? "Aktion fehlgeschlagen.")
          return
        }
      } else {
        await destructive.onConfirm?.()
      }
      setConfirmOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 data-[force]:opacity-100"
      onClick={stop}
    >
      {editHref ? (
        <ActionIcon action={{ label: "Bearbeiten", icon: Pencil, href: editHref }} />
      ) : null}
      {primary ? <ActionIcon action={primary} /> : null}

      {hatKebab ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="ghost" aria-label="Weitere Aktionen" onClick={stop}>
                <MoreVertical />
              </Button>
            }
          />
          <DropdownMenuContent>
            {secondary.map((a) =>
              a.href ? (
                <DropdownMenuItem
                  key={a.label}
                  render={<Link href={a.href} onClick={stop} />}
                >
                  {a.icon ? <a.icon /> : null}
                  {a.label}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={a.label}
                  onClick={(e) => {
                    stop(e as unknown as React.MouseEvent)
                    a.onClick?.()
                  }}
                >
                  {a.icon ? <a.icon /> : null}
                  {a.label}
                </DropdownMenuItem>
              )
            )}
            {destructive ? (
              <>
                {secondary.length > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    stop(e as unknown as React.MouseEvent)
                    setConfirmOpen(true)
                  }}
                >
                  {destructive.label ?? DESTRUCTIVE_WORT[destructive.kind]}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {destructive ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {destructive.label ?? DESTRUCTIVE_WORT[destructive.kind]}?
              </DialogTitle>
              <DialogDescription>
                {destructive.description ??
                  "Diese Aktion kann nicht rückgängig gemacht werden."}
              </DialogDescription>
            </DialogHeader>
            {error ? <p className="text-danger text-sm">{error}</p> : null}
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Abbrechen</Button>} />
              <Button variant="destructive" onClick={runDestructive} disabled={busy}>
                {busy ? "…" : (destructive.label ?? DESTRUCTIVE_WORT[destructive.kind])}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
