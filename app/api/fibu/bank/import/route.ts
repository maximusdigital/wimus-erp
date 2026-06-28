import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"

import { createServerClient } from "@/lib/supabase/server"
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten"
import { parseKskCsv } from "@/lib/fibu/bank-csv"
import { matchUmsatz, type MatchKontext } from "@/lib/fibu/bank-match"
import { verteileEinnahme, type ForderungOffen } from "@/lib/fibu/op-abgleich"
import { offenerBetrag } from "@/lib/utils/forderungen"

type KontaktRef = { vorname: string | null; nachname: string | null; firmenname: string | null }

/** Supabase typt To-One-Embeds teils als Array → auf Objekt normalisieren. */
function one<T>(x: T | T[] | null | undefined): T | null {
  return Array.isArray(x) ? (x[0] ?? null) : (x ?? null)
}

function kontaktName(k: KontaktRef | null): string {
  if (!k) return ""
  return k.firmenname || [k.vorname, k.nachname].filter(Boolean).join(" ")
}

/**
 * Bank-CSV-Import (KSK/WISO): Datei-Bytes (CP1252) → Parse → mehrstufiger Match →
 * OP-Abgleich (FIFO-Kaskade) gegen offene Miete-Forderungen → bank_umsaetze
 * (Dublettenschutz via import_hash). Vorfilter eigene Umbuchungen über Auto-Namen
 * (firmen + bank_konten) + pflegbare Ignorier-Muster; Schwellen aus bank_einstellungen.
 * Erwartet multipart/form-data mit `file` (+ optional `bank_konto_id`).
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const mandanten = await getUserMandanten()
  const active = await getActiveMandant(mandanten)
  if (!active) return NextResponse.json({ error: "Kein aktiver Mandant." }, { status: 400 })

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV-Datei fehlt (Feld 'file')." }, { status: 422 })
  }
  const bankKontoId = (form?.get("bank_konto_id") as string) || null

  const bytes = Buffer.from(await file.arrayBuffer())
  const text = new TextDecoder("windows-1252").decode(bytes)
  const { zeilen, fehler } = parseKskCsv(text)
  if (zeilen.length === 0) {
    return NextResponse.json({ error: "Keine Umsätze erkannt.", fehler }, { status: 422 })
  }

  const [objekteR, einheitenR, vertraegeR, forderungenR, bestandR, firmenR, kontenR, ignorierR, einstR] =
    await Promise.all([
      supabase.schema("wimus").from("objekte").select("id, kuerzel").eq("mandant_id", active.id),
      supabase.schema("wimus").from("einheiten").select("id, objekt_id, verwendungszweck_code").eq("mandant_id", active.id),
      supabase
        .schema("wimus")
        .from("mietvertraege")
        .select("id, einheit_id, grundmiete, mieter:kontakte!mieter_id(vorname, nachname, firmenname), einheit:einheiten!einheit_id(id, objekt_id)")
        .eq("mandant_id", active.id),
      supabase
        .schema("wimus")
        .from("forderungen")
        .select("id, mietvertrag_id, betrag, bezahlt_betrag, faellig_am")
        .eq("mandant_id", active.id)
        .eq("forderung_typ", "miete")
        .in("status", ["offen", "teilbezahlt"])
        .order("faellig_am", { ascending: true }),
      supabase.schema("wimus").from("bank_umsaetze").select("import_hash").eq("mandant_id", active.id),
      supabase.schema("wimus").from("firmen").select("name").eq("mandant_id", active.id),
      supabase.schema("wimus").from("bank_konten").select("bezeichnung, inhaber").eq("mandant_id", active.id),
      supabase.schema("wimus").from("bank_ignorier_muster").select("muster").eq("mandant_id", active.id).eq("aktiv", true),
      supabase.schema("wimus").from("bank_einstellungen").select("auto_schwelle, pruefen_schwelle, name_min").eq("mandant_id", active.id).maybeSingle(),
    ])

  const objekte = (objekteR.data ?? []).filter((o) => o.kuerzel) as { id: string; kuerzel: string }[]
  const einheiten = (einheitenR.data ?? []).filter((e) => e.verwendungszweck_code).map((e) => ({
    id: e.id,
    objekt_id: e.objekt_id as string,
    code: e.verwendungszweck_code as string,
  }))

  // Offene Miete-Forderungen je Vertrag (FIFO – älteste zuerst).
  const forderungenProVertrag = new Map<string, ForderungOffen[]>()
  for (const f of forderungenR.data ?? []) {
    if (!f.mietvertrag_id) continue
    const arr = forderungenProVertrag.get(f.mietvertrag_id) ?? []
    arr.push({ id: f.id, betrag: f.betrag ?? 0, bezahlt_betrag: f.bezahlt_betrag })
    forderungenProVertrag.set(f.mietvertrag_id, arr)
  }

  const mieter: MatchKontext["mieter"] = ((vertraegeR.data ?? []) as unknown as Array<{
    id: string
    einheit_id: string | null
    grundmiete: number | null
    einheit: { id: string; objekt_id: string } | { id: string; objekt_id: string }[] | null
    mieter: KontaktRef | KontaktRef[] | null
  }>).map((v) => {
    const erste = forderungenProVertrag.get(v.id)?.[0]
    const offen = erste ? offenerBetrag(erste) : v.grundmiete ?? null
    const einheit = one(v.einheit)
    return {
      mietvertrag_id: v.id,
      objekt_id: einheit?.objekt_id ?? null,
      einheit_id: v.einheit_id ?? null,
      name: kontaktName(one(v.mieter)),
      offene_miete: offen,
    }
  }).filter((m) => m.name)

  // Vorfilter: eigene Namen (firmen + bank_konten) + pflegbare Ignorier-Muster.
  const kontoinhaber = [
    ...(firmenR.data ?? []).map((f) => f.name).filter(Boolean),
    ...(kontenR.data ?? []).flatMap((k) => [k.bezeichnung, (k as { inhaber?: string | null }).inhaber]).filter(Boolean),
  ] as string[]
  const ignorierMuster = (ignorierR.data ?? []).map((i) => i.muster).filter(Boolean) as string[]
  const e = einstR.data
  const schwellen = e
    ? { auto: Number(e.auto_schwelle), pruefen: Number(e.pruefen_schwelle), nameMin: Number(e.name_min) }
    : undefined

  const ctx: MatchKontext = { einheiten, objekte, mieter, kontoinhaber, ignorierMuster, schwellen }
  const vorhandene = new Set((bestandR.data ?? []).map((b) => b.import_hash))

  const summary = { gesamt: zeilen.length, importiert: 0, dubletten: 0, ignoriert: 0, auto: 0, pruefen: 0, klaeren: 0, fehler }

  for (const z of zeilen) {
    const hash = createHash("sha256")
      .update(`${active.id}|${bankKontoId ?? ""}|${z.wertstellung}|${z.betrag}|${z.verwendungszweck}`)
      .digest("hex")
    if (vorhandene.has(hash)) {
      summary.dubletten++
      continue
    }
    vorhandene.add(hash)

    const m = matchUmsatz(z, ctx)

    let zuordnung_status = "offen"
    let forderung_id: string | null = null
    let zugeordnet_am: string | null = null

    if (m.ignoriert) {
      zuordnung_status = "ignoriert"
      summary.ignoriert++
    } else if (z.richtung === "einnahme" && m.mietvertrag_id && m.routing === "auto") {
      // OP-Abgleich (FIFO-Kaskade) über alle offenen Forderungen des Vertrags.
      const offene = forderungenProVertrag.get(m.mietvertrag_id) ?? []
      const v = verteileEinnahme(z.betrag, offene)
      for (const a of v.allokationen) {
        await supabase
          .schema("wimus")
          .from("forderungen")
          .update({
            bezahlt_betrag: a.neuer_bezahlt_betrag,
            status: a.neuer_status,
            bezahlt_am: a.neuer_status === "bezahlt" ? z.wertstellung : null,
          })
          .eq("id", a.forderung_id)
      }
      // Verbrauchte/teilbezahlte Forderungen im Speicher aktualisieren (Folgezeilen).
      const rest = offene
        .map((f) => {
          const a = v.allokationen.find((x) => x.forderung_id === f.id)
          return a ? { ...f, bezahlt_betrag: a.neuer_bezahlt_betrag, _status: a.neuer_status } : f
        })
        .filter((f) => (f as { _status?: string })._status !== "bezahlt")
        .map((f) => ({ id: f.id, betrag: f.betrag, bezahlt_betrag: f.bezahlt_betrag }))
      forderungenProVertrag.set(m.mietvertrag_id, rest)

      forderung_id = v.allokationen[0]?.forderung_id ?? null
      zuordnung_status = "zugeordnet"
      zugeordnet_am = new Date().toISOString()
      summary.auto++
    } else if (m.routing === "pruefen") {
      summary.pruefen++
    } else {
      summary.klaeren++
    }

    const { error } = await supabase.schema("wimus").from("bank_umsaetze").insert({
      mandant_id: active.id,
      bank_konto_id: bankKontoId,
      wertstellung: z.wertstellung,
      empfaenger: z.empfaenger || null,
      verwendungszweck: z.verwendungszweck || null,
      kategorie_wiso: z.kategorie_wiso || null,
      betrag: z.betrag,
      saldo: z.saldo,
      richtung: z.richtung,
      import_hash: hash,
      erkanntes_k1: m.erkanntes_k1,
      objekt_id: m.objekt_id,
      einheit_id: m.einheit_id,
      mietvertrag_id: m.mietvertrag_id,
      match_methode: m.match_methode,
      match_confidence: m.match_confidence,
      zuordnung_status,
      forderung_id,
      zugeordnet_am,
    })
    if (error) {
      summary.fehler.push(`${z.wertstellung} ${z.betrag}: ${error.message}`)
    } else {
      summary.importiert++
    }
  }

  return NextResponse.json(summary, { status: 200 })
}
