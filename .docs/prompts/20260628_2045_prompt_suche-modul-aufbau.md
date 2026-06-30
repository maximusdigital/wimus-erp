# Bau-Auftrag: Modul 006 (suche) — Such-/Filter-Schicht aufbauen (2026-06-28 20:45 MESZ)

Vorab-Spec liegt vollständig vor: `006_suche_000_konzept.md` / `_200_datenmodell.md` /
`_300_prozesse.md` in `.docs/specs/`. Diese ist zu ~99% entscheidungsfest — bau danach,
verifiziere die markierten ‹…›-Stellen gegen das reale `wimus`-Schema, schärfe im Report.

## Scope (Stufe 1)
1. **Extension + Indizes** (Migration, idempotent): `pg_trgm` aktivieren; GIN-Trigram-Indizes
   je durchsuchbarer Spalte; `such_vektor`-generierte Spalten (FTS, 'german') wo Freitext.
2. **Such-Schicht** `lib/search/`: `registry.ts`, `query-builder.ts`, `global-search.ts`,
   `config.ts`, `types.ts` — exakt nach Datenmodell §2–§7.
3. **UI**: `command-palette.tsx` (globale Suche, ⌘K) + `filter-bar.tsx` (Pro-Modul), an
   bestehende Shadcn DataTable ANDOCKEN, nicht ersetzen.
4. **Erste Module mit Filterleiste**: FiBu/Bank + Vorgänge (große Tabellen, häufige Suche) —
   Reihenfolge im Report bestätigen/anpassen.

## HARTE Anforderungen
- **RLS-Konform:** alle Such-Queries über die normale Supabase-Client-Schicht, KEINE
  Service-Role-Umgehung. Nutzer findet nie mandantenfremde Treffer (global + Filter). RLS-Test
  einbauen (Nutzer A findet keine Daten von Mandant B).
- **Fan-out** für globale Suche (§4 Datenmodell), KEINE materialisierte Spiegel-Tabelle in
  Stufe 1. Falls Performance real zu langsam → im Report als geplante Optimierung vermerken,
  nicht ungefragt bauen.
- **Keine dritte Fuzzy-Logik:** DB = `pg_trgm`, In-Memory bleibt `fuzzball`. Nicht vermischen.
- Schwellen/Limits zentral konfigurierbar (`config.ts`), Defaults aus Datenmodell §7.

## Leitplanken (immer)
- Git-Sicherung vorab; Migrationen idempotent; kein Commit ohne grüne Tests
  (`npm run test:run` + `npm run build`); nichts doppeln (vorhandene Indizes nicht neu bauen).
- Git add/commit/push selbstständig (Permission erteilt), kein force-push.

## Autonomie / Rückfragen
Eigenständig + vollständig durcharbeiten. Die ‹…›-Stellen (Entitäts-Whitelist, reale Tabellen/
Felder/Tenant-Spalten, vorhandene Indizes) gegen reales Schema VERIFIZIEREN — was real nicht
existiert, weglassen + im Report dokumentieren. Blocker NICHT raten → Report-Rückfragen.

## Report-Pflicht
`.docs/reports/JJJJMMTT_UHRZEIT_report_suche-modul.md` (MESZ): (1) Gebaut mit echten Tabellen/
Feldern/Indizes, (2) Abweichungen (v.a. welche Whitelist-Entitäten real existieren), (3) Offen,
(4) Rückfragen.
