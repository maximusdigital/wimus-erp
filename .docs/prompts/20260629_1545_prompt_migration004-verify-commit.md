# Auftrag: Migration 004 gegen Live-Schema verifizieren + committen (2026-06-29 15:45 MESZ)

**Zweikomponentig: (A) reine LESE-Verifikation der von Konzept-Claude geschriebenen Migration 004
gegen das Live-Schema, dann (B) Commit der Migration + der uncommitteten Doku.** KEIN Schema-Umbau,
KEIN ALTER/CREATE/DROP gegen die Live-DB. Migration 004 ist eine reine Tracking-/Idempotenz-Migration
(zeichnet Live-Ist nach, No-Op auf Live) — wir wollen NUR bestätigen, dass sie exakt passt, bevor sie
in die Kette eingecheckt wird.

## Kontext
- Datei: `supabase/migrations/004_org_hierarchie.sql` (von Konzept-Claude aus der DDL-Extraktion
  `.docs/_NOTE_org-hierarchie-live-ddl.md` gebaut). Schließt die „fehlende Migration 004" (Backlog #21
  Phase A). Tabellen workspaces/firmen/projekte laufen bereits live.
- Ziel: sicherstellen, dass das rekonstruierte DDL 1:1 dem Live-Schema entspricht — sonst baut eine
  FRISCHE DB anders als Live (subtiler, gefährlicher Drift).

## Teil A — Verifikation (READ-ONLY, kein Guardrail nötig, nur SELECT)

1. **Migration 004 lesen** (`004_org_hierarchie.sql`) und gegen die NOTE
   (`.docs/_NOTE_org-hierarchie-live-ddl.md`) abgleichen. Pro Tabelle prüfen:
   - Spalten: Name, Typ, nullable, default — vollständig & korrekt übernommen?
   - Constraints: PK, FKs (workspace_id, firma_id, parent/mutter Selbst-FKs), UNIQUE
     (workspaces.kuerzel), alle CHECK-Wertelisten (firmen_typ/rechtsform_typ/besteuerungsart/
     umsatzsteuer_typ/umsatzsteuer_period, projekte_typ/status) — Wertelisten Zeichen für Zeichen?
   - Indizes (idx_projekte_firma/parent/workspace), Trigger (trg_*_updated_at), RLS (p_org_read).
   - projektmanager_id-FK: korrekt KONDITIONAL (nur wenn akteure existiert)?
2. **Optional gegen Live gegenchecken** (nur SELECT über /pg/query, falls zur Sicherheit gewünscht):
   dieselben information_schema/pg_*-Abfragen wie bei der Extraktion erneut nur für Stichproben —
   ABER die NOTE ist frisch (heute), daher reicht primär der Datei↔NOTE-Abgleich.
3. **NICHT** Migration 004 gegen die Live-DB ausführen. Sie ist auf Live No-Op, aber wir brauchen
   den Lauf nicht — die Verifikation ist ein Abgleich, kein Anwenden. (Auf einer evtl. vorhandenen
   lokalen/Test-DB darf `npm`-Testsetup sie fahren, falls euer Schema-Bootstrap das ohnehin tut.)
4. **Abweichungen?** Wenn DDL ≠ NOTE: NICHT selbst korrigieren und committen. Stattdessen die
   konkreten Abweichungen im Report (Abschnitt Rückfragen) auflisten → Konzept-Claude korrigiert die
   Migration. NUR bei 100% Übereinstimmung weiter zu Teil B.

## Teil B — Commit (nur wenn Teil A sauber)

Wenn die Migration verifiziert ist, committe folgendes (autonomer Commit nach eurem Zyklus, kein
force-push):
- `supabase/migrations/004_org_hierarchie.sql` (neu)
- Uncommittete Doku aus dieser Session (von Konzept-Claude geschrieben, liegen im Arbeitsverzeichnis):
  - `.docs/specs/010_berechtigungen_000_konzept.md`, `_200_datenmodell.md`, `_300_prozesse.md` (neu)
  - `.docs/_INDEX.md` (Modul 010 ergänzt)
  - `.docs/_LOG.md` (mehrere Einträge: 009/008 Stufe 2, 010-Spec)
  - `.docs/_BACKLOG.md` (#19/#20/#21 ergänzt)
  - `.docs/_NOTE_org-hierarchie-live-ddl.md` (DDL-Extraktion, falls noch nicht committet)
  - `.docs/prompts/20260629_1510_prompt_org-ddl-extraktion.md`,
    `.docs/prompts/20260629_1545_prompt_migration004-verify-commit.md` (dieser Auftrag)
  - der Extraktions-Report `.docs/reports/20260629_1535_report_org-ddl-extraktion.md` (falls noch offen)
- Commit-Message-Vorschlag:
  `feat(db): Migration 004 Org-Hierarchie (Tracking V501) + Modul 010 Berechtigungen Spec + Doku`
- **Migration 004 NICHT gegen Live anwenden** — sie wird mit dem nächsten regulären Schema-Lauf/auf
  frischer DB wirksam; auf Live ist sie No-Op. Falls ihr einen expliziten Live-Apply-Schritt habt:
  das ist ein SEPARATER, guardrail-pflichtiger Vorgang (exakte SQL zeigen, Freigabe) — NICHT Teil
  dieses Auftrags.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_migration004-verify-commit.md` (4 Abschnitte). Besonders:
- Abschnitt 1: Verifikations-Ergebnis je Tabelle (Spalten/Constraints/CHECK-Listen/Indizes/RLS/
  Trigger — passt / Abweichung).
- Abschnitt 4: alle gefundenen Abweichungen (falls vorhanden) für Konzept-Claude; sonst „keine".
- Ob committet wurde (Commit-Hash) oder warum nicht (Abweichung blockiert).

## NICHT tun
- Kein ALTER/CREATE/DROP/INSERT/UPDATE/DELETE gegen die Live-DB.
- Migration 004 NICHT inhaltlich umschreiben (bei Abweichung → Report, Konzept-Claude macht es).
- Keine .docs/specs/** oder _BACKLOG.md ändern (CC fasst Specs/Backlog nie an).
- Bei Unsicherheit STOPP + parken (Questions-Abschnitt im Report).
