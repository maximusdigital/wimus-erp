/**
 * Entitäts-Registry (Modul 006, Herzstück) – deklariert, welche Entität wie
 * durchsuchbar/filterbar ist. Code-Konfiguration (keine DB-Tabelle).
 *
 * Entitäten + Felder sind gegen das reale `wimus`-Schema verifiziert (s. Report).
 * `forderungen` ist bewusst NICHT drin: keine Trigram-taugliche Textspalte.
 */
import {
  VORGANG_STATUS,
  VORGANG_STATUS_LABELS,
  VORGANG_TYPEN,
  VORGANG_TYP_LABELS,
  VORGANG_PRIORITAET,
  VORGANG_PRIORITAET_LABELS,
} from "@/types/vorgang"
import type { SearchEntity } from "./types"

function enumOpt(keys: readonly string[], labels: Record<string, string>) {
  return keys.map((k) => ({ value: k, label: labels[k] ?? k }))
}

export const SEARCH_REGISTRY: SearchEntity[] = [
  {
    key: "kontakte",
    table: "kontakte",
    labelSingular: "Kontakt",
    routePattern: "/kontakte/{id}",
    tenantColumn: "mandant_id",
    trigramFields: ["nachname", "vorname", "firmenname", "email"],
    titleFields: ["firmenname", "nachname"],
    subtitleFields: ["email", "stadt"],
    globalWeight: 1.0,
    inGlobalSearch: true,
  },
  {
    key: "objekte",
    table: "objekte",
    labelSingular: "Objekt",
    routePattern: "/objekte/{id}",
    tenantColumn: "mandant_id",
    trigramFields: ["kuerzel", "strasse", "stadt"],
    titleFields: ["kuerzel", "strasse"],
    subtitleFields: ["stadt"],
    globalWeight: 0.9,
    inGlobalSearch: true,
  },
  {
    key: "einheiten",
    table: "einheiten",
    labelSingular: "Einheit",
    routePattern: "/einheiten/{id}",
    tenantColumn: "mandant_id",
    trigramFields: ["verwendungszweck_code", "kuerzel", "bezeichnung"],
    titleFields: ["verwendungszweck_code", "bezeichnung", "kuerzel"],
    globalWeight: 0.9,
    inGlobalSearch: true,
  },
  {
    key: "mietvertraege",
    table: "mietvertraege",
    labelSingular: "Mietvertrag",
    routePattern: "/vertraege/{id}",
    tenantColumn: "mandant_id",
    trigramFields: ["aktenzeichen"],
    titleFields: ["aktenzeichen"],
    globalWeight: 0.8,
    inGlobalSearch: true,
  },
  {
    key: "vorgaenge",
    table: "vorgaenge",
    labelSingular: "Vorgang",
    routePattern: "/vorgaenge/{id}",
    tenantColumn: "mandant_id",
    trigramFields: ["aktenzeichen"],
    titleFields: ["aktenzeichen"],
    filterFields: [
      { column: "status", label: "Status", type: "enum", optionen: enumOpt(VORGANG_STATUS, VORGANG_STATUS_LABELS) },
      { column: "typ", label: "Typ", type: "enum", optionen: enumOpt(VORGANG_TYPEN, VORGANG_TYP_LABELS) },
      { column: "prioritaet", label: "Priorität", type: "enum", optionen: enumOpt(VORGANG_PRIORITAET, VORGANG_PRIORITAET_LABELS) },
      { column: "leistungsdatum", label: "Leistungsdatum", type: "date" },
    ],
    globalWeight: 0.8,
    inGlobalSearch: true,
  },
  {
    key: "buchungen",
    table: "buchungen",
    labelSingular: "Buchung",
    routePattern: "/buchungen/{id}",
    tenantColumn: "mandant_id",
    trigramFields: ["aktenzeichen"],
    titleFields: ["aktenzeichen"],
    globalWeight: 0.7,
    inGlobalSearch: true,
  },
]

export function getEntity(key: string): SearchEntity | undefined {
  return SEARCH_REGISTRY.find((e) => e.key === key)
}

export function globalEntities(): SearchEntity[] {
  return SEARCH_REGISTRY.filter((e) => e.inGlobalSearch)
}
