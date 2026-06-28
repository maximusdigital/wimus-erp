/**
 * Werte lesen/schreiben (Variante C). Server-only. Kapselt die typisierten
 * wert_*-Spalten + Mehrfachauswahl-Optionstabelle. setWert ist idempotent
 * (Upsert je def+zeile), validiert Typ + Pflicht über mapping.ts.
 */
import { normalisiereWert, istLeer } from "./mapping"
import type { Ergebnis } from "./definition"
import type { FieldType, FieldValue } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any

/** Alle Custom-Field-Werte einer Entitäts-Zeile (für die Detailansicht). */
export async function getWerte(
  client: DbClient,
  entitaet: string,
  entitaetId: string,
): Promise<FieldValue[]> {
  const { data: werte } = await client
    .from("custom_field_werte")
    .select("id, definition_id, wert_text, wert_zahl, wert_datum, wert_bool, custom_field_definitionen!inner(feldtyp)")
    .eq("bezug_typ", entitaet)
    .eq("bezug_id", entitaetId)
  if (!werte) return []

  const valueIds = werte.map((w: { id: string }) => w.id)
  const optByValue = await ladeWertOptionen(client, valueIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return werte.map((w: any) => ({
    def_id: w.definition_id,
    typ: w.custom_field_definitionen?.feldtyp as FieldType,
    text: w.wert_text ?? null,
    zahl: w.wert_zahl ?? null,
    datum: w.wert_datum ?? null,
    bool: w.wert_bool ?? null,
    optionen: optByValue.get(w.id) ?? [],
  }))
}

async function ladeWertOptionen(client: DbClient, valueIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (valueIds.length === 0) return map
  const { data } = await client
    .from("custom_field_value_option")
    .select("value_id, custom_field_option!inner(opt_key)")
    .in("value_id", valueIds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    const arr = map.get(r.value_id) ?? []
    if (r.custom_field_option?.opt_key) arr.push(r.custom_field_option.opt_key)
    map.set(r.value_id, arr)
  }
  return map
}

/**
 * Einen Custom-Field-Wert setzen (idempotenter Upsert je def+zeile).
 * `roh` ist der UI-Rohwert; Typ/Pflicht werden über die Definition validiert.
 */
export async function setWert(
  client: DbClient,
  mandantId: string,
  defId: string,
  entitaet: string,
  entitaetId: string,
  roh: unknown,
): Promise<Ergebnis<true>> {
  const { data: def } = await client
    .from("custom_field_definitionen")
    .select("feldtyp, pflichtfeld")
    .eq("id", defId)
    .single()
  if (!def) return { ok: false, error: "Feld-Definition nicht gefunden." }

  const typ = def.feldtyp as FieldType
  const norm = normalisiereWert(typ, roh)
  if (!norm.ok) return { ok: false, error: norm.fehler }
  if (def.pflichtfeld && istLeer(typ, norm.wert)) {
    return { ok: false, error: "Pflichtfeld darf nicht leer sein." }
  }

  // Upsert auf (definition_id, bezug_typ, bezug_id) — Unique-Index trägt den Konflikt.
  const { data: wert, error } = await client
    .from("custom_field_werte")
    .upsert(
      {
        mandant_id: mandantId,
        definition_id: defId,
        bezug_typ: entitaet,
        bezug_id: entitaetId,
        wert_text: norm.wert.wert_text,
        wert_zahl: norm.wert.wert_zahl,
        wert_datum: norm.wert.wert_datum,
        wert_bool: norm.wert.wert_bool,
      },
      { onConflict: "definition_id,bezug_typ,bezug_id" },
    )
    .select("id")
    .single()
  if (error || !wert) return { ok: false, error: error?.message ?? "Speichern fehlgeschlagen." }

  if (typ === "mehrfachauswahl") {
    const setRes = await setWertOptionen(client, defId, wert.id, norm.wert.optionen)
    if (!setRes.ok) return setRes
  }
  return { ok: true, data: true }
}

/** Mehrfachauswahl-Optionen eines Werts neu setzen (opt_keys → option_ids). */
async function setWertOptionen(
  client: DbClient,
  defId: string,
  valueId: string,
  optKeys: string[],
): Promise<Ergebnis<true>> {
  await client.from("custom_field_value_option").delete().eq("value_id", valueId)
  if (optKeys.length === 0) return { ok: true, data: true }
  const { data: opts } = await client
    .from("custom_field_option")
    .select("id, opt_key")
    .eq("def_id", defId)
    .in("opt_key", optKeys)
  const rows = (opts ?? []).map((o: { id: string }) => ({ value_id: valueId, option_id: o.id }))
  if (rows.length === 0) return { ok: true, data: true }
  const { error } = await client.from("custom_field_value_option").insert(rows)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}
