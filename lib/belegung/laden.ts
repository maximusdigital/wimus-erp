/**
 * Belegungs-Loader (Kern 0001): lädt die drei Quellen einer Einheit (KZV-Buchungen,
 * Mietverträge, manuelle Sperren) über die RLS-Client-Schicht und mappt sie auf
 * `Belegung[]` für die reine Engine (`verfuegbarkeit.ts`). KEINE Service-Role-Umgehung.
 */
import type { createServerClient } from "@/lib/supabase/server"

import type { Belegung } from "./verfuegbarkeit"

/** RLS-gebundener Server-Client (Schema wimus) – echter Rückgabetyp von createServerClient. */
type ServerClient = Awaited<ReturnType<typeof createServerClient>>

type Kontakt = { vorname: string | null; nachname: string | null; firmenname: string | null }
function name(k: Kontakt | Kontakt[] | null | undefined): string {
  const o = Array.isArray(k) ? k[0] : k
  if (!o) return ""
  return o.firmenname || [o.vorname, o.nachname].filter(Boolean).join(" ")
}

/** Datetime/Datum → ISO-Datum (YYYY-MM-DD) für saubere Tagesgrenzen. */
function tag(v: string | null): string | null {
  if (!v) return null
  return v.slice(0, 10)
}

/**
 * Nächster Tag zu einem ISO-Datum (YYYY-MM-DD). Für die INKLUSIVE MV-Ende-Semantik:
 * ein Mietvertrag belegt bis `mietende` einschließlich → in der halboffenen Engine
 * `[von, bis)` ist das `bis = mietende + 1 Tag` (Entscheidung 001_erp, 2026-06-28).
 * KZV-Checkout bleibt halboffen (Checkout-Tag frei).
 */
export function naechsterTag(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Lädt alle belegenden Zeiträume einer Einheit aus den drei Quellen.
 * @param supabase RLS-gebundener Server-Client (kein Service-Role!)
 */
export async function ladeBelegungen(
  supabase: ServerClient,
  einheitId: string
): Promise<Belegung[]> {
  const [buchungenR, vertraegeR, sperrenR] = await Promise.all([
    supabase
      .schema("wimus")
      .from("buchungen")
      .select("id, checkin, checkout, status, gast:kontakte!gast_id(vorname, nachname, firmenname)")
      .eq("einheit_id", einheitId),
    supabase
      .schema("wimus")
      .from("mietvertraege")
      .select("id, mietbeginn, mietende, mieter:kontakte!mieter_id(vorname, nachname, firmenname)")
      .eq("einheit_id", einheitId),
    supabase
      .schema("wimus")
      .from("belegung_sperren")
      .select("id, von, bis, grund, notiz")
      .eq("einheit_id", einheitId),
  ])

  const belegungen: Belegung[] = []

  for (const b of (buchungenR.data ?? []) as Array<{
    id: string
    checkin: string | null
    checkout: string | null
    status: string | null
    gast: Kontakt | Kontakt[] | null
  }>) {
    if (!b.checkin) continue
    belegungen.push({
      quelle: "buchung",
      ref_id: b.id,
      von: tag(b.checkin)!,
      bis: tag(b.checkout),
      typ: b.status,
      label: name(b.gast) || "Gast",
    })
  }

  for (const m of (vertraegeR.data ?? []) as Array<{
    id: string
    mietbeginn: string | null
    mietende: string | null
    mieter: Kontakt | Kontakt[] | null
  }>) {
    if (!m.mietbeginn) continue
    const mietendeTag = tag(m.mietende)
    belegungen.push({
      quelle: "mietvertrag",
      ref_id: m.id,
      von: tag(m.mietbeginn)!,
      // INKLUSIV: belegt bis mietende einschließlich → halboffenes bis = mietende + 1 Tag.
      bis: mietendeTag ? naechsterTag(mietendeTag) : null, // null = unbefristet
      typ: "Mietvertrag",
      label: name(m.mieter) || "Mieter",
    })
  }

  for (const s of (sperrenR.data ?? []) as Array<{
    id: string
    von: string
    bis: string | null
    grund: string
    notiz: string | null
  }>) {
    belegungen.push({
      quelle: "sperre",
      ref_id: s.id,
      von: s.von,
      bis: s.bis,
      typ: s.grund,
      label: s.notiz ?? s.grund,
    })
  }

  return belegungen
}
