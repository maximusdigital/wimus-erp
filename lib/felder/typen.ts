/**
 * Kontakt-/Organisationstypen (n:m) + Zuordnung. Server-only.
 * System-Typen (geschuetzt) sind serverseitig gegen Löschen/Umbenennen/Key-
 * Änderung geschützt; Module prüfen Zugehörigkeit über den stabilen typ_key.
 */
import { uniqueKey } from "./key"
import type { Ergebnis } from "./definition"
import type { KontaktTyp } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTyp(row: any): KontaktTyp {
  return {
    id: row.id,
    mandant_id: row.mandant_id,
    gilt_fuer: row.gilt_fuer,
    typ_key: row.typ_key,
    label: row.label,
    geschuetzt: !!row.geschuetzt,
    beschreibung: row.beschreibung ?? null,
    sortierung: row.sortierung ?? 0,
    aktiv: !!row.aktiv,
  }
}

/** Typen einer Dimension (person|organisation), sortiert. */
export async function listTypen(client: DbClient, giltFuer?: "person" | "organisation"): Promise<KontaktTyp[]> {
  let q = client.from("kontakt_typen").select("*").order("sortierung", { ascending: true })
  if (giltFuer) q = q.eq("gilt_fuer", giltFuer)
  const { data } = await q
  return (data ?? []).map(mapTyp)
}

/** Neuen freien Typ anlegen (typ_key stabil aus Label, eindeutig je Dimension). */
export async function createTyp(
  client: DbClient,
  mandantId: string,
  giltFuer: "person" | "organisation",
  label: string,
  beschreibung?: string | null,
): Promise<Ergebnis<KontaktTyp>> {
  if (!label?.trim()) return { ok: false, error: "Label ist Pflicht." }
  const { data: bestehende } = await client
    .from("kontakt_typen")
    .select("typ_key")
    .eq("gilt_fuer", giltFuer)
  const vergeben = (bestehende ?? []).map((t: { typ_key: string }) => t.typ_key)
  const key = uniqueKey(label, vergeben)
  const { data, error } = await client
    .from("kontakt_typen")
    .insert({
      mandant_id: mandantId,
      gilt_fuer: giltFuer,
      typ_key: key,
      label: label.trim(),
      beschreibung: beschreibung ?? null,
      geschuetzt: false,
      sortierung: (vergeben.length + 1) * 10,
      aktiv: true,
    })
    .select("*")
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? "Anlage fehlgeschlagen." }
  return { ok: true, data: mapTyp(data) }
}

/** Label/Beschreibung/Sortierung/aktiv ändern. geschuetzt: nicht umbenennbar. */
export async function updateTyp(
  client: DbClient,
  id: string,
  patch: { label?: string; beschreibung?: string | null; sortierung?: number; aktiv?: boolean },
): Promise<Ergebnis<true>> {
  const { data: typ } = await client.from("kontakt_typen").select("geschuetzt").eq("id", id).single()
  if (!typ) return { ok: false, error: "Typ nicht gefunden." }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  if (patch.beschreibung !== undefined) update.beschreibung = patch.beschreibung
  if (patch.sortierung !== undefined) update.sortierung = patch.sortierung
  if (typ.geschuetzt) {
    if (patch.label !== undefined || patch.aktiv === false) {
      return { ok: false, error: "Geschützter Typ: nicht umbenennbar/deaktivierbar." }
    }
  } else {
    if (patch.label !== undefined) {
      if (!patch.label.trim()) return { ok: false, error: "Label darf nicht leer sein." }
      update.label = patch.label.trim()
    }
    if (patch.aktiv !== undefined) update.aktiv = patch.aktiv
  }
  if (Object.keys(update).length === 0) return { ok: true, data: true }
  const { error } = await client.from("kontakt_typen").update(update).eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}

/** Freien Typ löschen. geschuetzt blockiert serverseitig. */
export async function deleteTyp(client: DbClient, id: string): Promise<Ergebnis<true>> {
  const { data: typ } = await client.from("kontakt_typen").select("geschuetzt").eq("id", id).single()
  if (!typ) return { ok: false, error: "Typ nicht gefunden." }
  if (typ.geschuetzt) return { ok: false, error: "Geschützter Typ ist nicht löschbar." }
  const { error } = await client.from("kontakt_typen").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}

// --- Zuordnung (n:m) an Person/Organisation ---------------------------------

/** typ_ids eines Ziels (person|organisation). */
export async function getZuordnungen(client: DbClient, zielTyp: "person" | "organisation", zielId: string): Promise<string[]> {
  const { data } = await client
    .from("kontakt_typ_zuordnung")
    .select("typ_id")
    .eq("ziel_typ", zielTyp)
    .eq("ziel_id", zielId)
  return (data ?? []).map((z: { typ_id: string }) => z.typ_id)
}

/** Typen eines Ziels komplett setzen (Differenz-Update). */
export async function setZuordnungen(
  client: DbClient,
  mandantId: string,
  zielTyp: "person" | "organisation",
  zielId: string,
  typIds: string[],
): Promise<Ergebnis<true>> {
  const aktuell = new Set(await getZuordnungen(client, zielTyp, zielId))
  const soll = new Set(typIds)
  const zuFuegen = typIds.filter((t) => !aktuell.has(t))
  const zuLoeschen = [...aktuell].filter((t) => !soll.has(t))

  if (zuLoeschen.length > 0) {
    await client
      .from("kontakt_typ_zuordnung")
      .delete()
      .eq("ziel_typ", zielTyp)
      .eq("ziel_id", zielId)
      .in("typ_id", zuLoeschen)
  }
  if (zuFuegen.length > 0) {
    const rows = zuFuegen.map((typ_id) => ({ mandant_id: mandantId, typ_id, ziel_typ: zielTyp, ziel_id: zielId }))
    const { error } = await client.from("kontakt_typ_zuordnung").insert(rows)
    if (error) return { ok: false, error: error.message }
  }
  return { ok: true, data: true }
}
