/**
 * Modul 008 (felder) – öffentliche Service-Schnittstelle.
 * Konsumenten (UI, API-Routen, 0006-Filter) importieren NUR von hier, nie direkt
 * die Wert-Tabellen/JSONB → Speicher-Variante (aktuell C) bleibt gekapselt.
 */
export * from "./types"
export { slugifyKey, uniqueKey } from "./key"
export { wertSpalte, filterTypFor, normalisiereWert, istLeer, leererWert } from "./mapping"
export type { NormWert } from "./mapping"
export {
  listDefs,
  createDef,
  updateDef,
  deleteDef,
  setOptionen,
} from "./definition"
export type { Ergebnis, CreateDefInput, UpdateDefInput } from "./definition"
export { getWerte, setWert } from "./value"
export {
  listTypen,
  createTyp,
  updateTyp,
  deleteTyp,
  getZuordnungen,
  setZuordnungen,
} from "./typen"
export {
  defsToFilterFields,
  customFieldIds,
  cfColumn,
  isCfColumn,
  cfKeyFromColumn,
  CF_PREFIX,
} from "./filter-adapter"
export type { CfFilterWert } from "./filter-adapter"
