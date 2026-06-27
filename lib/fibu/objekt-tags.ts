/**
 * Objekt-Tags (Spec 0002, objekt_tags) – Gruppierung der „horizontalen Achse"
 * für Auswertungen: Objekte nach nutzungsart / marke / region bündeln, ohne sie
 * einzeln auswählen zu müssen. Rein/testbar (DB-frei).
 */

export const TAG_DIMENSIONEN = [
  { value: "nutzungsart", label: "Nutzungsart" },
  { value: "marke", label: "Marke" },
  { value: "region", label: "Region" },
] as const
export type TagDimension = (typeof TAG_DIMENSIONEN)[number]["value"]

export function tagDimensionLabel(value: string): string {
  return TAG_DIMENSIONEN.find((d) => d.value === value)?.label ?? value
}

export type ObjektTag = { tag_typ: string; wert: string }

/** Platzhalter-Gruppe für Objekte ohne Tag in der gewählten Dimension. */
export const OHNE_TAG = "(ohne)"

export type TagGruppe<T> = { wert: string; objekte: T[] }

/**
 * Gruppiert Objekte nach den Werten einer Tag-Dimension. Ein Objekt kann in
 * mehreren Gruppen erscheinen (mehrere Tags gleicher Dimension). Objekte ohne
 * passenden Tag landen in der Gruppe `OHNE_TAG`. Gruppen alphabetisch sortiert,
 * `OHNE_TAG` immer ans Ende.
 */
export function gruppiereNachTag<T extends { tags: ObjektTag[] }>(
  objekte: T[],
  dimension: TagDimension
): TagGruppe<T>[] {
  const map = new Map<string, T[]>()

  for (const obj of objekte) {
    const werte = obj.tags.filter((t) => t.tag_typ === dimension).map((t) => t.wert)
    const ziele = werte.length > 0 ? werte : [OHNE_TAG]
    for (const w of ziele) {
      if (!map.has(w)) map.set(w, [])
      map.get(w)!.push(obj)
    }
  }

  return [...map.entries()]
    .map(([wert, objekte]) => ({ wert, objekte }))
    .sort((a, b) => {
      if (a.wert === OHNE_TAG) return 1
      if (b.wert === OHNE_TAG) return -1
      return a.wert.localeCompare(b.wert)
    })
}

/** Distinkte, sortierte Tag-Werte einer Dimension (für Filter-Dropdowns). */
export function tagWerte(objekte: { tags: ObjektTag[] }[], dimension: TagDimension): string[] {
  const set = new Set<string>()
  for (const o of objekte) {
    for (const t of o.tags) if (t.tag_typ === dimension) set.add(t.wert)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
