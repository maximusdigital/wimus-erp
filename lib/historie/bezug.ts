/**
 * Bezug-Ableitung (zentral, 0007-Muster). REINE Logik — keine DB.
 * Aus dem Primär-Bezug + der aufgelösten Hierarchie entstehen die n:m-Bezüge:
 * primär = die Entität am Ereignis; abgeleitet = höhere Hierarchie-Ebenen
 * (Mieter→Einheit→Objekt …), damit „inkl. untergeordnete"-Sichten greifen.
 */
import type { Bezug, EntityRef, Hierarchie } from "./types"

/**
 * Liefert die vollständige (deduplizierte) Bezugsliste für eine Aktivität.
 * Der Primär-Bezug bekommt quelle='primaer', alle abgeleiteten 'abgeleitet'
 * (außer sie sind identisch mit dem Primär-Bezug → bleibt primär).
 */
export function leiteBezuege(primaer: EntityRef, h: Hierarchie): Bezug[] {
  const out = new Map<string, Bezug>()
  const key = (b: EntityRef) => `${b.typ}:${b.id}`

  // Primär zuerst (gewinnt bei Kollision).
  out.set(key(primaer), { ...primaer, quelle: "primaer" })

  const add = (typ: Bezug["typ"], id?: string | null) => {
    if (!id) return
    const k = `${typ}:${id}`
    if (!out.has(k)) out.set(k, { typ, id, quelle: "abgeleitet" })
  }

  add("mietvertrag", h.mietvertrag_id)
  add("mieter", h.mieter_id)
  add("kontakt", h.kontakt_id)
  add("einheit", h.einheit_id)
  add("objekt", h.objekt_id)
  add("vorgang", h.vorgang_id)
  add("organisation", h.organisation_id)
  add("buchung", h.buchung_id)

  return [...out.values()]
}
