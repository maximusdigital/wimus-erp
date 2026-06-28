/**
 * Feed lesen – zentral (globaler Mandanten-Feed) + dezentral (je Entität,
 * Ebenen-Umschalter). Server-only. RLS isoliert den Mandanten in der DB.
 */
import type { Aktivitaet, BezugTyp } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

export type FeedFilter = {
  modul?: string
  typ?: string
  limit?: number
  /** ISO-Zeitpunkt: nur Aktivitäten älter als dieser (Lazy-Load/Pagination). */
  before?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAkt(r: any): Aktivitaet {
  return {
    id: r.id,
    mandant_id: r.mandant_id,
    typ: r.typ,
    modul: r.modul,
    titel: r.titel,
    beschreibung: r.beschreibung ?? null,
    akteur_id: r.akteur_id ?? null,
    audit_log_id: r.audit_log_id ?? null,
    payload: r.payload ?? null,
    zeitpunkt: r.zeitpunkt,
  }
}

/** Zentraler Feed (neueste oben). */
export async function getFeed(client: DbClient, filter: FeedFilter = {}): Promise<Aktivitaet[]> {
  let q = client
    .from("aktivitaeten")
    .select("*")
    .order("zeitpunkt", { ascending: false })
    .limit(filter.limit ?? 50)
  if (filter.modul) q = q.eq("modul", filter.modul)
  if (filter.typ) q = q.eq("typ", filter.typ)
  if (filter.before) q = q.lt("zeitpunkt", filter.before)
  const { data } = await q
  return (data ?? []).map(mapAkt)
}

/**
 * Dezentraler Feed je Entität.
 * - inklUntergeordnete=false → nur Aktivitäten mit PRIMÄR-Bezug auf diese Entität.
 * - inklUntergeordnete=true  → alle Bezüge (primär + abgeleitet) → „inkl. untergeordnete"
 *   (Verwalter-Sicht; höhere Ebenen sehen ihre untergeordneten Ereignisse).
 */
export async function getFeedFor(
  client: DbClient,
  bezugTyp: BezugTyp,
  bezugId: string,
  opts: { inklUntergeordnete?: boolean; limit?: number } = {},
): Promise<Aktivitaet[]> {
  let bq = client
    .from("aktivitaet_bezug")
    .select("aktivitaet_id, quelle")
    .eq("bezug_typ", bezugTyp)
    .eq("bezug_id", bezugId)
  if (!opts.inklUntergeordnete) bq = bq.eq("quelle", "primaer")
  const { data: bez } = await bq
  const ids = Array.from(new Set((bez ?? []).map((b: { aktivitaet_id: string }) => b.aktivitaet_id)))
  if (ids.length === 0) return []

  const { data } = await client
    .from("aktivitaeten")
    .select("*")
    .in("id", ids)
    .order("zeitpunkt", { ascending: false })
    .limit(opts.limit ?? 100)
  return (data ?? []).map(mapAkt)
}
