import type { SupabaseClient } from "@supabase/supabase-js"

import type { VertragRelation } from "@/lib/vertrag-zuordnung"

/**
 * Liest eine optionale ID-Liste aus dem Request-Body.
 * Rückgabe `null`, wenn der Schlüssel fehlt (→ Beziehung nicht anfassen);
 * `string[]` (ggf. leer), wenn er gesetzt ist (→ Beziehung abgleichen).
 */
export function readIdList(json: unknown, key: string): string[] | null {
  const raw = (json as Record<string, unknown> | null)?.[key]
  if (!Array.isArray(raw)) return null
  return [...new Set(raw.filter((v): v is string => typeof v === "string"))]
}

/**
 * Gleicht eine 1:N-Beziehung der Verträge mit der Auswahl ab.
 * Vertrags-FKs sind nullable: nicht mehr ausgewählte Verträge werden gelöst
 * (FK = null), neu ausgewählte diesem Datensatz zugeordnet.
 * Gibt eine Fehlermeldung zurück oder `null` bei Erfolg.
 */
export async function reconcileVertragRelation(
  supabase: SupabaseClient,
  relation: VertragRelation,
  parentId: string,
  selectedIds: string[]
): Promise<string | null> {
  const { data: current, error: readError } = await supabase
    .schema("wimus")
    .from("mietvertraege")
    .select("id")
    .eq(relation, parentId)
  if (readError) return readError.message

  const currentIds = (current ?? []).map((r) => r.id as string)
  const toDetach = currentIds.filter((id) => !selectedIds.includes(id))
  const toAttach = selectedIds.filter((id) => !currentIds.includes(id))

  if (toDetach.length > 0) {
    const { error } = await supabase
      .schema("wimus")
      .from("mietvertraege")
      .update({ [relation]: null })
      .in("id", toDetach)
    if (error) return error.message
  }
  if (toAttach.length > 0) {
    const { error } = await supabase
      .schema("wimus")
      .from("mietvertraege")
      .update({ [relation]: parentId })
      .in("id", toAttach)
    if (error) return error.message
  }
  return null
}
