# Auftrag: Live-DDL der Org-Hierarchie extrahieren (Phase A von #21) (2026-06-29 15:10 MESZ)

**REINER LESE-/EXTRAKTIONS-AUFTRAG. KEIN Schema-Umbau, KEINE Migration anwenden, KEIN Commit von
Strukturänderungen.** Ziel: das echte Live-DDL der Org-Tabellen `wimus.workspaces`,
`wimus.firmen`, `wimus.projekte` (+ direkt abhängige Objekte) auslesen und als Textdatei ablegen,
damit Konzept-Claude daraus die getrackte Migration 004 baut.

## Hintergrund (Backlog #21)
Die Org-Struktur Workspace→Firma→Projekt läuft live (von Migration 006 befüllt, app-seitig
genutzt), aber das DDL ist NICHT als Migration getrackt („fehlende Migration 004"). Diese fehlt
in der Kette (003 → [004 fehlt] → 005). Phase A = reines Tracking nachholen, NICHTS verändern.

## Weg: /pg/query (Port 5432 ist extern zu)
`pg_dump` braucht den direkten DB-Port → NICHT verfügbar. Stattdessen über
`POST https://supa.m81s.de/pg/query` (postgres-meta, Service-Role) NUR LESENDE Abfragen.
**Alle Abfragen sind SELECT — kein DDL, kein INSERT/UPDATE/DELETE. Daher KEIN Bestätigungs-
Guardrail nötig (der gilt nur für Schreibzugriffe). Falls eine Abfrage etwas anderes als SELECT
wäre: STOPP + im Report parken.**

## Zu extrahieren (je Tabelle workspaces, firmen, projekte)

1. **Spalten** (Reihenfolge, Typ, nullable, default):
   ```sql
   SELECT table_name, ordinal_position, column_name, data_type, udt_name,
          character_maximum_length, numeric_precision, numeric_scale,
          is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema='wimus'
     AND table_name IN ('workspaces','firmen','projekte')
   ORDER BY table_name, ordinal_position;
   ```

2. **Constraints** (PK, FK, UNIQUE, CHECK):
   ```sql
   SELECT tc.table_name, tc.constraint_type, tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table, ccu.column_name AS foreign_column,
          cc.check_clause
   FROM information_schema.table_constraints tc
   LEFT JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
   LEFT JOIN information_schema.constraint_column_usage ccu
     ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema
   LEFT JOIN information_schema.check_constraints cc
     ON tc.constraint_name=cc.constraint_name AND tc.table_schema=cc.constraint_schema
   WHERE tc.table_schema='wimus'
     AND tc.table_name IN ('workspaces','firmen','projekte')
   ORDER BY tc.table_name, tc.constraint_type;
   ```
   > CHECK-Klauseln sind wichtig (z.B. projekte.ebene, projekte.typ, firmen.typ-Wertelisten).

3. **Indizes** (inkl. der nicht-Constraint-Indizes):
   ```sql
   SELECT tablename, indexname, indexdef
   FROM pg_indexes
   WHERE schemaname='wimus'
     AND tablename IN ('workspaces','firmen','projekte')
   ORDER BY tablename, indexname;
   ```

4. **RLS-Policies** (Org-Tabellen haben in 006 p_org_read; evtl. mehr):
   ```sql
   SELECT tablename, policyname, cmd, roles, qual, with_check
   FROM pg_policies
   WHERE schemaname='wimus'
     AND tablename IN ('workspaces','firmen','projekte')
   ORDER BY tablename, policyname;
   ```
   Zusätzlich: ist RLS aktiviert?
   ```sql
   SELECT relname, relrowsecurity, relforcerowsecurity
   FROM pg_class WHERE relnamespace='wimus'::regnamespace
     AND relname IN ('workspaces','firmen','projekte');
   ```

5. **Trigger** (updated_at etc.):
   ```sql
   SELECT event_object_table AS table_name, trigger_name, action_timing,
          event_manipulation, action_statement
   FROM information_schema.triggers
   WHERE trigger_schema='wimus'
     AND event_object_table IN ('workspaces','firmen','projekte')
   ORDER BY table_name, trigger_name;
   ```

6. **Abhängigkeits-Check (WICHTIG):** Verweist eine der drei Tabellen per FK auf eine weitere
   wimus-Tabelle, die NICHT zu {workspaces,firmen,projekte} gehört? Aus den FK-Ergebnissen von (2)
   ablesen. Falls ja: deren Spalten/Constraints ebenfalls mit (1)+(2) ziehen UND im Report
   prominent vermerken (Konzept-Claude muss wissen, ob 004 weitere Tabellen umfassen muss).
   Umgekehrt: hängt eine BEKANNTE Fachtabelle bereits per FK an projekt_id? (select aus
   information_schema FK-usage mit foreign_table IN ('projekte','firmen','workspaces')) — auch das
   vermerken (zeigt, ob schon irgendwas verdrahtet ist).

## Output
- Rohergebnisse aller Abfragen sammeln und als **eine Textdatei** ablegen:
  `.docs/_NOTE_org-hierarchie-live-ddl.md` (per filesystem write_file; KEIN Commit nötig —
  Konzept-Claude liest sie direkt und baut daraus 004).
- Pro Abschnitt klar beschriftet (Spalten / Constraints / Indizes / RLS / Trigger / Abhängigkeiten),
  Ergebnisse als Tabellen oder JSON, wie sie /pg/query liefert — nicht interpretieren, nur roh
  ablegen. Lieber vollständig als hübsch.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_org-ddl-extraktion.md` — 4 Punkte. Besonders Abschnitt 3
(Offen) / 4 (Rückfragen): Gibt es abhängige Tabellen außerhalb der drei? Hängt schon eine
Fachtabelle an projekt_id? Irgendwelche Überraschungen im Live-Schema (Spalten, die in 006 nicht
sichtbar waren)?

## NICHT tun
- Keine Schema-Änderung, kein CREATE/ALTER/DROP, kein INSERT/UPDATE/DELETE.
- Migration 004 NICHT selbst schreiben/anwenden — das macht Konzept-Claude aus deinem Output.
- Nichts committen außer (optional) der NOTE-Datei + dem Report.
- Bei irgendeiner Unsicherheit (Abfrage liefert Unerwartetes, Schreibzugriff nötig schiene):
  STOPP + parken.
