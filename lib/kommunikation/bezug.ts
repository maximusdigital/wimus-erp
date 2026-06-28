/**
 * Kommunikations-Schicht (Modul 007) — Bezugs-Ableitung (rein/testbar).
 *
 * „Zentral UND dezentral, eine Wahrheit": jede Nachricht erhält Bezüge in
 * `kom_nachricht_bezug`. Basis ist IMMER der Kontakt (quelle=adressiert). Immobilien-
 * bezug (Einheit/Objekt) wird NUR bei Kontakten mit solchem Bezug über die Hierarchie
 * abgeleitet (Mieter → Einheit → Objekt, quelle=abgeleitet). Bei WG-/Sammel-Nachricht
 * ist die Einheit/WG selbst adressiert (quelle=adressiert), die Nachricht erscheint
 * dann bei der WG/Einheit UND bei jedem einzelnen Mieter.
 *
 * Dedup: pro (bezug_typ, bezug_id) ein Eintrag; `adressiert` schlägt `abgeleitet`.
 */

import type { Bezug } from "./types"

export type KontaktBezugEingabe = {
  kontakt_id: string
  /** aktuelle Einheit/Objekt des Kontakts (nur wenn Immobilienbezug existiert). */
  einheit_id?: string | null
  objekt_id?: string | null
  /** Rolle Mieter? → bezug_typ 'mieter' zusätzlich zur 'kontakt'-Basis. */
  ist_mieter?: boolean
}

export type BezugEingabe = {
  /** Direkt adressierte Kontakte (mind. einer; bei Sammel mehrere). */
  kontakte: KontaktBezugEingabe[]
  /** WG/Einheit als Ganzes adressiert (Sammel-Nachricht). */
  einheitAdressiert?: { einheit_id: string; objekt_id?: string | null } | null
  /** Optionaler Vorgangsbezug. */
  vorgang_id?: string | null
}

/** Erzeugt die deduplizierte Bezugs-Liste für eine Nachricht. */
export function leiteBezuege(eingabe: BezugEingabe): Bezug[] {
  const map = new Map<string, Bezug>()

  const add = (b: Bezug) => {
    const key = `${b.bezug_typ}|${b.bezug_id}`
    const vorhanden = map.get(key)
    // adressiert gewinnt gegen abgeleitet; sonst erster Eintrag bleibt.
    if (!vorhanden || (vorhanden.quelle === "abgeleitet" && b.quelle === "adressiert")) {
      map.set(key, b)
    }
  }

  for (const k of eingabe.kontakte) {
    add({ bezug_typ: "kontakt", bezug_id: k.kontakt_id, quelle: "adressiert" })
    if (k.ist_mieter) add({ bezug_typ: "mieter", bezug_id: k.kontakt_id, quelle: "adressiert" })
    if (k.einheit_id) add({ bezug_typ: "einheit", bezug_id: k.einheit_id, quelle: "abgeleitet" })
    if (k.objekt_id) add({ bezug_typ: "objekt", bezug_id: k.objekt_id, quelle: "abgeleitet" })
  }

  if (eingabe.einheitAdressiert) {
    const { einheit_id, objekt_id } = eingabe.einheitAdressiert
    add({ bezug_typ: "einheit", bezug_id: einheit_id, quelle: "adressiert" })
    add({ bezug_typ: "wg", bezug_id: einheit_id, quelle: "adressiert" })
    if (objekt_id) add({ bezug_typ: "objekt", bezug_id: objekt_id, quelle: "abgeleitet" })
  }

  if (eingabe.vorgang_id) {
    add({ bezug_typ: "vorgang", bezug_id: eingabe.vorgang_id, quelle: "adressiert" })
  }

  return [...map.values()]
}
