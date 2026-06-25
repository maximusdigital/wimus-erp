import { createServerClient } from "@/lib/supabase/server"

export type ObjektOption = { id: string; label: string }
export type BkArtOption = { id: string; label: string; standard_schluessel: string | null }
export type AbrechnungseinheitOption = { id: string; label: string; objekt_id: string }
export type EinheitOption = {
  id: string
  label: string
  objekt_id: string | null
  flaeche: number | null
}
export type MietvertragOption = {
  id: string
  label: string
  einheit_id: string | null
}

/** Objekte als Auswahlliste (Kürzel + Stadt). */
export async function loadObjektOptions(): Promise<ObjektOption[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("objekte")
    .select("id, kuerzel, stadt")
    .order("kuerzel", { nullsFirst: false })

  type Row = { id: string; kuerzel: string | null; stadt: string | null }
  return ((data ?? []) as Row[]).map((o) => ({
    id: o.id,
    label: [o.kuerzel, o.stadt].filter(Boolean).join(" · ") || "Objekt",
  }))
}

/** BK-Kostenarten als Auswahlliste. */
export async function loadBkArtOptions(): Promise<BkArtOption[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("bk_arten")
    .select("id, bezeichnung, standard_schluessel")
    .order("bezeichnung")

  type Row = {
    id: string
    bezeichnung: string | null
    standard_schluessel: string | null
  }
  return ((data ?? []) as Row[]).map((b) => ({
    id: b.id,
    label: b.bezeichnung || "Kostenart",
    standard_schluessel: b.standard_schluessel,
  }))
}

/** Abrechnungseinheiten als Auswahlliste. */
export async function loadAbrechnungseinheitOptions(): Promise<
  AbrechnungseinheitOption[]
> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("abrechnungseinheiten")
    .select("id, bezeichnung, objekt_id")
    .order("bezeichnung")

  type Row = { id: string; bezeichnung: string | null; objekt_id: string }
  return ((data ?? []) as Row[]).map((a) => ({
    id: a.id,
    label: a.bezeichnung || "Abrechnungseinheit",
    objekt_id: a.objekt_id,
  }))
}

/** Einheiten als Auswahlliste (optional auf ein Objekt gefiltert). */
export async function loadEinheitOptions(
  objektId?: string
): Promise<EinheitOption[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from("einheiten")
    .select("id, verwendungszweck_code, bezeichnung, flaeche, objekt_id")
    .order("verwendungszweck_code", { nullsFirst: false })

  if (objektId) query = query.eq("objekt_id", objektId)

  const { data } = await query

  type Row = {
    id: string
    verwendungszweck_code: string | null
    bezeichnung: string | null
    flaeche: number | null
    objekt_id: string | null
  }
  return ((data ?? []) as Row[]).map((e) => ({
    id: e.id,
    label: e.verwendungszweck_code || e.bezeichnung || "Einheit",
    objekt_id: e.objekt_id,
    flaeche: e.flaeche,
  }))
}

/** Mietverträge als Auswahlliste. */
export async function loadMietvertragOptions(): Promise<MietvertragOption[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("mietvertraege")
    .select("id, aktenzeichen, einheit_id")
    .order("aktenzeichen", { nullsFirst: false })

  type Row = {
    id: string
    aktenzeichen: string | null
    einheit_id: string | null
  }
  return ((data ?? []) as Row[]).map((v) => ({
    id: v.id,
    label: v.aktenzeichen || "Vertrag",
    einheit_id: v.einheit_id,
  }))
}
