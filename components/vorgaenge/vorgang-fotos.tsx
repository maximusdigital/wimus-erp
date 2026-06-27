"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, Check, GaugeCircle, Loader2, Plus, ScanSearch, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type FotoRow = {
  id: string
  phase: string
  url: string | null
  beschreibung: string | null
  aufgenommen_am: string
  ki_status?: string | null
  ki_confidence?: number | null
  ki_analyse?: unknown
}

const PHASEN = [
  { value: "vorher", label: "Vorher" },
  { value: "nachher", label: "Nachher" },
  { value: "befund", label: "Befund" },
] as const

const KI_STATUS_META: Record<string, { label: string; className: string }> = {
  auto: { label: "KI: auto", className: "bg-success/10 text-success" },
  pruefen: { label: "KI: prüfen", className: "bg-warning/10 text-warning" },
  manuell: { label: "KI: manuell", className: "bg-danger/10 text-danger" },
}

/** Bild client-seitig auf max. 1600px verkleinern (mobile-freundlich, kleiner Upload). */
function downscale(file: File, max = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas nicht verfügbar."))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

type ZaehlerErgebnis = {
  zaehler: { art: string; zaehlernummer: string | null; stand: number | null; einheit: string | null }[]
}
type SchadenVorschlag = {
  ort: string
  beschreibung: string
  schaden_typ: string | null
  schwere: string | null
  neu: boolean
}
type AbgleichErgebnis = { schaeden: SchadenVorschlag[] }
type SchadenStatus = { state: "busy" | "done" | "error"; href?: string; az?: string; msg?: string }

export function VorgangFotos({ vorgangId, fotos }: { vorgangId: string; fotos: FotoRow[] }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [phase, setPhase] = React.useState<string>("vorher")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [gross, setGross] = React.useState<string | null>(null)
  const [analyse, setAnalyse] = React.useState<string | null>(null) // fotoId | "abgleich" | null
  // Status je Schadensvorschlag (Index → busy/done/error), session-lokal.
  const [schadenStatus, setSchadenStatus] = React.useState<Record<number, SchadenStatus>>({})

  const hatVorher = fotos.some((f) => f.phase === "vorher" && f.url)
  const hatNachher = fotos.some((f) => f.phase === "nachher" && f.url)
  // Abgleich-Ergebnis liegt am jüngsten Nachher-Foto.
  const abgleichTraeger = [...fotos]
    .filter((f) => f.phase === "nachher" && f.ki_status)
    .sort((a, b) => a.aufgenommen_am.localeCompare(b.aufgenommen_am))
    .at(-1)

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      for (const file of files) {
        const dataUrl = await downscale(file)
        const res = await fetch(`/api/vorgaenge/${vorgangId}/foto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase, dataUrl }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => null)
          setError(j?.error ?? "Upload fehlgeschlagen.")
          break
        }
      }
      router.refresh()
    } catch {
      setError("Bild konnte nicht verarbeitet werden.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function del(id: string) {
    await fetch(`/api/ops/foto/${id}`, { method: "DELETE" })
    router.refresh()
  }

  async function analysiere(body: { modus: "zaehler"; fotoId: string } | { modus: "abgleich" }) {
    const key = body.modus === "zaehler" ? body.fotoId : "abgleich"
    setAnalyse(key)
    setError(null)
    try {
      const res = await fetch(`/api/vorgaenge/${vorgangId}/foto-analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error ?? "KI-Analyse fehlgeschlagen.")
        return
      }
      router.refresh()
    } catch {
      setError("KI-Analyse fehlgeschlagen.")
    } finally {
      setAnalyse(null)
    }
  }

  async function uebernehmeSchaden(index: number, s: SchadenVorschlag) {
    setSchadenStatus((m) => ({ ...m, [index]: { state: "busy" } }))
    try {
      const res = await fetch(`/api/vorgaenge/${vorgangId}/schaden-uebernehmen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ort: s.ort,
          beschreibung: s.beschreibung,
          schaden_typ: s.schaden_typ,
          schwere: s.schwere,
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) {
        setSchadenStatus((m) => ({ ...m, [index]: { state: "error", msg: j?.error ?? "Fehlgeschlagen." } }))
        return
      }
      setSchadenStatus((m) => ({
        ...m,
        [index]: { state: "done", href: `/vorgaenge/${j.id}`, az: j.aktenzeichen ?? undefined },
      }))
    } catch {
      setSchadenStatus((m) => ({ ...m, [index]: { state: "error", msg: "Fehlgeschlagen." } }))
    }
  }

  function KiBadge({ foto }: { foto: FotoRow }) {
    if (!foto.ki_status) return null
    const meta = KI_STATUS_META[foto.ki_status]
    if (!meta) return null
    const conf = foto.ki_confidence != null ? ` ${Math.round(foto.ki_confidence * 100)}%` : ""
    return (
      <Badge className={cn("absolute left-1 top-1 text-[10px]", meta.className)}>
        {meta.label}
        {conf}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Capture-Leiste (mobile-first, große Touch-Ziele) */}
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <div className="flex overflow-hidden rounded-md border">
          {PHASEN.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPhase(p.value)}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium",
                phase === p.value ? "bg-secondary/10 text-secondary" : "text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button type="button" size="lg" className="h-12" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <Camera />}
          <span>{busy ? "Lädt…" : `Foto aufnehmen / wählen (${PHASEN.find((p) => p.value === phase)?.label})`}</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onFiles}
        />

        {/* KI: Vorher/Nachher-Abgleich (Claude Vision) */}
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={!hatVorher || !hatNachher || analyse === "abgleich"}
          onClick={() => analysiere({ modus: "abgleich" })}
          title={!hatVorher || !hatNachher ? "Braucht je ein Vorher- und Nachher-Foto" : undefined}
        >
          {analyse === "abgleich" ? <Loader2 className="animate-spin" /> : <ScanSearch />}
          <span>Vorher/Nachher abgleichen (KI)</span>
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      {/* Abgleich-Ergebnis */}
      {abgleichTraeger?.ki_analyse ? (
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-medium">KI-Abgleich Vorher/Nachher</p>
            {abgleichTraeger.ki_status ? (
              <Badge className={cn("text-[10px]", KI_STATUS_META[abgleichTraeger.ki_status]?.className)}>
                {KI_STATUS_META[abgleichTraeger.ki_status]?.label}
                {abgleichTraeger.ki_confidence != null ? ` ${Math.round(abgleichTraeger.ki_confidence * 100)}%` : ""}
              </Badge>
            ) : null}
          </div>
          <SchaedenListe
            analyse={abgleichTraeger.ki_analyse as AbgleichErgebnis}
            status={schadenStatus}
            onUebernehmen={uebernehmeSchaden}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Vorschläge – „Als Schaden anlegen" erzeugt je einen Folge-Vorgang (Typ Schaden).
          </p>
        </div>
      ) : null}

      {/* Galerie je Phase */}
      {PHASEN.map((p) => {
        const items = fotos.filter((f) => f.phase === p.value)
        if (items.length === 0) return null
        return (
          <div key={p.value}>
            <p className="mb-2 text-sm font-medium">{p.label}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((f) => (
                <div key={f.id} className="flex flex-col gap-1">
                  <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    {f.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.url}
                        alt={f.beschreibung ?? p.label}
                        className="size-full cursor-zoom-in object-cover"
                        onClick={() => setGross(f.url)}
                      />
                    ) : null}
                    <KiBadge foto={f} />
                    <button
                      onClick={() => del(f.id)}
                      aria-label="Foto löschen"
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {/* KI: Zählerstand erkennen (kritisch → nie auto) */}
                  <button
                    type="button"
                    disabled={analyse === f.id}
                    onClick={() => analysiere({ modus: "zaehler", fotoId: f.id })}
                    className="inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {analyse === f.id ? <Loader2 className="size-3.5 animate-spin" /> : <GaugeCircle className="size-3.5" />}
                    <span>Zähler lesen</span>
                  </button>
                  {/* Erkannte Zählerstände */}
                  {f.ki_analyse && isZaehler(f.ki_analyse) ? (
                    <ZaehlerListe analyse={f.ki_analyse as ZaehlerErgebnis} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {fotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Fotos.</p>
      ) : null}

      {/* Vollbild-Lightbox */}
      {gross ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setGross(null)}
        >
          <button className="absolute right-4 top-4 text-white" aria-label="Schließen">
            <X />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gross} alt="Foto" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      ) : null}
    </div>
  )
}

function isZaehler(a: unknown): a is ZaehlerErgebnis {
  return typeof a === "object" && a !== null && Array.isArray((a as { zaehler?: unknown }).zaehler)
}

function ZaehlerListe({ analyse }: { analyse: ZaehlerErgebnis }) {
  if (analyse.zaehler.length === 0) {
    return <p className="text-xs text-muted-foreground">Kein Zähler erkannt.</p>
  }
  return (
    <ul className="rounded-md border p-1.5 text-xs">
      {analyse.zaehler.map((z, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span className="text-muted-foreground">{z.art}</span>
          <span className="font-medium">
            {z.stand ?? "?"} {z.einheit ?? ""}
          </span>
        </li>
      ))}
    </ul>
  )
}

function SchaedenListe({
  analyse,
  status,
  onUebernehmen,
}: {
  analyse: AbgleichErgebnis
  status: Record<number, SchadenStatus>
  onUebernehmen: (index: number, s: SchadenVorschlag) => void
}) {
  if (analyse.schaeden.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine neuen Schäden erkannt.</p>
  }
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {analyse.schaeden.map((s, i) => {
        const st = status[i]
        return (
          <li key={i} className="flex items-start justify-between gap-2">
            <span className="flex items-start gap-2">
              <span className="text-danger">•</span>
              <span>
                <span className="font-medium">{s.ort || "?"}</span>
                {s.schwere ? (
                  <Badge variant="secondary" className="ml-2 text-[10px]">{s.schwere}</Badge>
                ) : null}
                <span className="block text-xs text-muted-foreground">{s.beschreibung}</span>
                {st?.state === "error" ? (
                  <span className="block text-xs text-danger">{st.msg}</span>
                ) : null}
              </span>
            </span>
            {st?.state === "done" ? (
              <Link
                href={st.href ?? "#"}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-success hover:underline"
              >
                <Check className="size-3.5" />
                <span>{st.az ?? "angelegt"}</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled={st?.state === "busy"}
                onClick={() => onUebernehmen(i, s)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {st?.state === "busy" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                <span>Als Schaden anlegen</span>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
