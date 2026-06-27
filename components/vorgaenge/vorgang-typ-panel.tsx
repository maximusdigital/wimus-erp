"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { schadenEinstufung } from "@/lib/ops/schaden"
import { VORGANG_TYP_LABELS } from "@/types/vorgang"

type Werte = Record<string, unknown>

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function VorgangTypPanel({
  vorgangId,
  typ,
  initial,
}: {
  vorgangId: string
  typ: string
  initial: Werte | null
}) {
  const router = useRouter()
  const [w, setW] = React.useState<Werte>(initial ?? {})
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const set = (k: string, v: unknown) => setW((p) => ({ ...p, [k]: v }))

  async function save() {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/vorgaenge/${vorgangId}/typ`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(w),
    })
    setBusy(false)
    if (res.ok) router.refresh()
    else {
      const j = await res.json().catch(() => null)
      setError(j?.error ?? "Speichern fehlgeschlagen.")
    }
  }

  const num = (k: string) => (w[k] == null ? "" : String(w[k]))
  const str = (k: string) => (w[k] == null ? "" : String(w[k]))
  const bool = (k: string) => w[k] === true

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {typ === "reinigung" ? (
          <>
            <Checkbox label="Turnaround (nach Check-out)" checked={bool("turnaround")} onChange={(v) => set("turnaround", v)} />
            <Checkbox label="Inventar geprüft / ok" checked={bool("inventar_ok")} onChange={(v) => set("inventar_ok", v)} />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Nächster Check-in</Label>
              <Input type="datetime-local" value={str("naechster_checkin")} onChange={(e) => set("naechster_checkin", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Dauer Soll (min)</Label>
              <Input inputMode="numeric" value={num("dauer_soll_min")} onChange={(e) => set("dauer_soll_min", e.target.value)} />
            </div>
          </>
        ) : null}

        {typ === "uebergabe" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Richtung</Label>
              <Select value={str("richtung") || "auszug"} onValueChange={(v) => set("richtung", v ?? "auszug")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => (v === "einzug" ? "Einzug" : "Auszug")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzug">Einzug</SelectItem>
                  <SelectItem value="auszug">Auszug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Checkbox label="Kautionsrelevant" checked={bool("kaution_relevant")} onChange={(v) => set("kaution_relevant", v)} />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs">Signatur (Paperless-ID)</Label>
              <Input value={str("signatur_paperless_id")} onChange={(e) => set("signatur_paperless_id", e.target.value)} />
            </div>
          </>
        ) : null}

        {typ === "wartung" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Intervall-Typ</Label>
              <Input value={str("intervall_typ")} onChange={(e) => set("intervall_typ", e.target.value)} placeholder="wartung_rauchmelder" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Nächste Fälligkeit</Label>
              <Input type="date" value={str("naechste_faelligkeit")} onChange={(e) => set("naechste_faelligkeit", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs">Prüfprotokoll (Paperless-ID)</Label>
              <Input value={str("pruefprotokoll_paperless_id")} onChange={(e) => set("pruefprotokoll_paperless_id", e.target.value)} />
            </div>
          </>
        ) : null}

        {typ === "reparatur" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Angebot (EUR)</Label>
              <Input inputMode="decimal" value={num("angebot_betrag")} onChange={(e) => set("angebot_betrag", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Gewährleistung bis</Label>
              <Input type="date" value={str("gewaehrleistung_bis")} onChange={(e) => set("gewaehrleistung_bis", e.target.value)} />
            </div>
            <Checkbox label="Abgenommen" checked={bool("abgenommen")} onChange={(v) => set("abgenommen", v)} />
          </>
        ) : null}

        {typ === "schaden" ? <SchadenFelder w={w} set={set} num={num} str={str} bool={bool} /> : null}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={busy}>
          <Save className="size-4" /> {VORGANG_TYP_LABELS[typ] ?? typ}-Daten speichern
        </Button>
      </div>
    </div>
  )
}

function SchadenFelder({
  w,
  set,
  num,
  str,
  bool,
}: {
  w: Werte
  set: (k: string, v: unknown) => void
  num: (k: string) => string
  str: (k: string) => string
  bool: (k: string) => boolean
}) {
  const betrag = w.schaden_betrag == null ? null : Number(w.schaden_betrag)
  const vorschlag = betrag != null ? schadenEinstufung(betrag) : null

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Schaden-Typ</Label>
        <Select value={str("schaden_typ") || "sonstiges"} onValueChange={(v) => set("schaden_typ", v)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => String(v ?? "sonstiges")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {["boden", "wand", "sanitaer", "elektro", "moebel", "fenster", "sonstiges"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Betrag (EUR)</Label>
        <Input
          inputMode="decimal"
          value={num("schaden_betrag")}
          onChange={(e) => {
            set("schaden_betrag", e.target.value)
            const b = e.target.value === "" ? null : Number(e.target.value)
            if (b != null && Number.isFinite(b)) {
              const v = schadenEinstufung(b)
              set("schwere", v.schwere)
              set("abwicklungsstufe", v.abwicklungsstufe)
              set("versicherungsfall", v.versicherung_pruefen)
            }
          }}
        />
        {vorschlag ? (
          <p className="text-xs text-muted-foreground">
            Vorschlag: {vorschlag.schwere} · {vorschlag.abwicklungsstufe}
            {vorschlag.versicherung_pruefen ? " · Versicherung prüfen" : ""}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Schwere</Label>
        <Select value={str("schwere") || "bagatell"} onValueChange={(v) => set("schwere", v)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => String(v ?? "bagatell")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {["bagatell", "mittel", "gross", "grossschaden"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Abwicklungsstufe</Label>
        <Select value={str("abwicklungsstufe") || "kaution"} onValueChange={(v) => set("abwicklungsstufe", v)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v) => String(v ?? "kaution")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {["kaution", "plattform", "manuell", "mahnbescheid", "anwalt"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Checkbox label="Versicherungsfall" checked={bool("versicherungsfall")} onChange={(v) => set("versicherungsfall", v)} />
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Festgestellt am</Label>
        <Input type="date" value={str("festgestellt_am")} onChange={(e) => set("festgestellt_am", e.target.value)} />
      </div>
    </>
  )
}
