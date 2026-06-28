/**
 * Modul 009 (historie) – öffentliche Service-Schnittstelle.
 * Module rufen NUR protokolliere(); UI nutzt getFeed/getFeedFor/getAudit.
 */
export * from "./types"
export { leiteBezuege } from "./bezug"
export {
  aktivitaetFarbe,
  aktivitaetIcon,
  zeitGruppe,
  gruppiereFeed,
  ZEIT_GRUPPE_LABEL,
} from "./stil"
export type { StilFarbe, ZeitGruppe } from "./stil"
export { protokolliere, resolveHierarchie } from "./protokolliere"
export type { ProtokollErgebnis } from "./protokolliere"
export { getFeed, getFeedFor } from "./feed"
export type { FeedFilter } from "./feed"
export { getAudit, getAuditFor } from "./audit"
export type { AuditFilter } from "./audit"
export { getAktuellerAkteur } from "./akteur"
