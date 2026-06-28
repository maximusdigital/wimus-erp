/**
 * CRUD Custom-Field-Definitionen + Optionen (Variante C). Server-only.
 * Kapselt die DB (Tabellen custom_field_definitionen / custom_field_option) —
 * Konsumenten sehen nur `FieldDef`. geschuetzt-Schutz wird hier serverseitig
 * erzwungen (nicht nur in der UI).
 */
import { uniqueKey } from "./key"
import type { FieldDef, FieldOption, FieldType } from "./types"

// Loser Client-Shape (createServerClient()-Ergebnis, Default-Schema wimus).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

export type Ergebnis<T> = { ok: true; data: T } | { ok: false; error: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDef(row: any, optionen: FieldOption[]): FieldDef {
  return {
    id: row.id,
    mandant_id: row.mandant_id,
    entitaet: row.bezug_typ,
    key: row.feldschluessel,
    label: row.feldname,
    typ: row.feldtyp as FieldType,
    geschuetzt: !!row.geschuetzt,
    pflicht: !!row.pflichtfeld,
    sortierung: row.reihenfolge ?? null,
    gruppe: row.gruppe ?? null,
    aktiv: !!row.aktiv,
    optionen,
  }
}

/** Alle (aktiven + inaktiven) Definitionen einer Entität, inkl. Optionen. */
export async function listDefs(client: DbClient, entitaet: string): Promise<FieldDef[]> {
  const { data: defs, error } = await client
    .from("custom_field_definitionen")
    .select("*")
    .eq("bezug_typ", entitaet)
    .order("reihenfolge", { ascending: true, nullsFirst: false })
  if (error || !defs) return []
  const ids = defs.map((d: { id: string }) => d.id)
  const optByDef = await ladeOptionen(client, ids)
  return defs.map((d: { id: string }) => mapDef(d, optByDef.get(d.id) ?? []))
}

async function ladeOptionen(client: DbClient, defIds: string[]): Promise<Map<string, FieldOption[]>> {
  const map = new Map<string, FieldOption[]>()
  if (defIds.length === 0) return map
  const { data } = await client
    .from("custom_field_option")
    .select("*")
    .in("def_id", defIds)
    .order("sortierung", { ascending: true })
  for (const o of data ?? []) {
    const arr = map.get(o.def_id) ?? []
    arr.push({ id: o.id, opt_key: o.opt_key, label: o.label, sortierung: o.sortierung, aktiv: !!o.aktiv })
    map.set(o.def_id, arr)
  }
  return map
}

export type CreateDefInput = {
  entitaet: string
  label: string
  typ: FieldType
  pflicht?: boolean
  gruppe?: string | null
  sortierung?: number | null
  optionen?: string[] // Labels; keys werden stabil erzeugt
}

/** Neue Definition. key wird stabil aus dem Label erzeugt (eindeutig je Entität). */
export async function createDef(
  client: DbClient,
  mandantId: string,
  input: CreateDefInput,
): Promise<Ergebnis<FieldDef>> {
  if (!input.label?.trim()) return { ok: false, error: "Label ist Pflicht." }

  const { data: bestehende } = await client
    .from("custom_field_definitionen")
    .select("feldschluessel")
    .eq("bezug_typ", input.entitaet)
  const vergeben = (bestehende ?? []).map((d: { feldschluessel: string }) => d.feldschluessel).filter(Boolean)
  const key = uniqueKey(input.label, vergeben)

  const { data: def, error } = await client
    .from("custom_field_definitionen")
    .insert({
      mandant_id: mandantId,
      bezug_typ: input.entitaet,
      feldname: input.label.trim(),
      feldschluessel: key,
      feldtyp: input.typ,
      pflichtfeld: input.pflicht ?? false,
      gruppe: input.gruppe ?? null,
      reihenfolge: input.sortierung ?? null,
      geschuetzt: false,
      aktiv: true,
    })
    .select("*")
    .single()
  if (error || !def) return { ok: false, error: error?.message ?? "Anlage fehlgeschlagen." }

  let optionen: FieldOption[] = []
  if ((input.typ === "auswahl" || input.typ === "mehrfachauswahl") && input.optionen?.length) {
    optionen = await setOptionen(client, def.id, input.optionen)
  }
  return { ok: true, data: mapDef(def, optionen) }
}

/** Optionen (Labels) anlegen — keys stabil + eindeutig je Definition. */
export async function setOptionen(client: DbClient, defId: string, labels: string[]): Promise<FieldOption[]> {
  const keys: string[] = []
  const rows = labels
    .map((l) => l.trim())
    .filter(Boolean)
    .map((label, i) => {
      const k = uniqueKey(label, keys)
      keys.push(k)
      return { def_id: defId, opt_key: k, label, sortierung: i * 10, aktiv: true }
    })
  if (rows.length === 0) return []
  const { data } = await client.from("custom_field_option").insert(rows).select("*")
  return (data ?? []).map((o: { id: string; opt_key: string; label: string; sortierung: number; aktiv: boolean }) => ({
    id: o.id, opt_key: o.opt_key, label: o.label, sortierung: o.sortierung, aktiv: !!o.aktiv,
  }))
}

export type UpdateDefInput = {
  label?: string
  pflicht?: boolean
  gruppe?: string | null
  sortierung?: number | null
  aktiv?: boolean
}

/**
 * Definition ändern. Typ + key sind NIE änderbar (Datenintegrität, Spec 300 §2.4).
 * geschuetzt: Label nicht umbenennbar, nicht deaktivierbar — nur Sortierung/Gruppe.
 */
export async function updateDef(
  client: DbClient,
  id: string,
  patch: UpdateDefInput,
): Promise<Ergebnis<true>> {
  const { data: def } = await client
    .from("custom_field_definitionen")
    .select("geschuetzt")
    .eq("id", id)
    .single()
  if (!def) return { ok: false, error: "Feld nicht gefunden." }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  if (patch.gruppe !== undefined) update.gruppe = patch.gruppe
  if (patch.sortierung !== undefined) update.reihenfolge = patch.sortierung
  if (patch.pflicht !== undefined) update.pflichtfeld = patch.pflicht

  if (def.geschuetzt) {
    if (patch.label !== undefined || patch.aktiv === false) {
      return { ok: false, error: "Geschütztes Feld: nicht umbenennbar/deaktivierbar." }
    }
  } else {
    if (patch.label !== undefined) {
      if (!patch.label.trim()) return { ok: false, error: "Label darf nicht leer sein." }
      update.feldname = patch.label.trim()
    }
    if (patch.aktiv !== undefined) update.aktiv = patch.aktiv
  }

  if (Object.keys(update).length === 0) return { ok: true, data: true }
  const { error } = await client.from("custom_field_definitionen").update(update).eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}

/** Definition löschen (+ Werte/Optionen via ON DELETE CASCADE). geschuetzt blockiert. */
export async function deleteDef(client: DbClient, id: string): Promise<Ergebnis<true>> {
  const { data: def } = await client
    .from("custom_field_definitionen")
    .select("geschuetzt")
    .eq("id", id)
    .single()
  if (!def) return { ok: false, error: "Feld nicht gefunden." }
  if (def.geschuetzt) return { ok: false, error: "Geschütztes Feld ist nicht löschbar." }
  const { error } = await client.from("custom_field_definitionen").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}
