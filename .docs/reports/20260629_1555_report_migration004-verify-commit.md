# Report: Migration 004 verifiziert + committet — 2026-06-29 15:55 MESZ

Auftrag: `.docs/prompts/20260629_1545_prompt_migration004-verify-commit.md`. Zweiteilig:
(A) read-only Verifikation `supabase/migrations/004_org_hierarchie.sql` gegen das Live-Schema,
(B) Commit bei 100%-Match. **Kein Schema-Umbau, kein ALTER/CREATE/DROP gegen Live.** Migration
NICHT gegen Live angewandt (auf Live ohnehin No-Op).

## 1) Verifikations-Ergebnis (Teil A) — **0 Abweichungen**

Methode: Migration-Datei programmatisch geparst + gegen das **Live-Schema** (read-only SELECTs über
`/pg/query`, `information_schema`/`pg_*`) abgeglichen — über die NOTE hinaus direkt gegen die laufende
DB (höchste Sicherheit gegen Drift). Geprüft je Tabelle workspaces/firmen/projekte:

| Aspekt | Ergebnis |
|--------|----------|
| **Spalten** (Name, vorhanden/extra) | ✅ identisch — ws 19, firmen 49, projekte 47, keine fehlende/zusätzliche |
| **Typen** (normalisiert: varchar(n)/numeric(p,s)/timestamptz/uuid/jsonb/…) | ✅ alle gleich |
| **Nullable** (NOT NULL / PK) | ✅ alle gleich |
| **Defaults** (cast-/quote-normalisiert) | ✅ alle gleich (gen_random_uuid(), now(), 'DE', '1F4E5F', 1, true, 'aktiv', false …) |
| **CHECK-Wertelisten** (Werte-Mengen je benanntem CHECK) | ✅ alle 7 exakt: firmen_typ, firmen_rechtsform_typ, firmen_besteuerungsart, firmen_umsatzsteuer_typ, firmen_umsatzsteuer_period, projekte_typ, projekte_status |
| **FKs** | ✅ workspace_id→workspaces, firma_id→firmen, mutter_firma_id→firmen (Selbst), parent_projekt_id→projekte (Selbst), projektmanager_id→akteure |
| **projektmanager_id-FK konditional** | ✅ korrekt: `DO`-Block legt FK nur an, wenn `akteure` existiert (entkoppelt 004 von der akteure-Migration) |
| **Indizes** | ✅ idx_projekte_firma / _parent / _workspace |
| **Trigger** | ✅ trg_{workspaces,firmen,projekte}_updated_at → wimus.set_updated_at() |
| **RLS** | ✅ enable + Policy p_org_read (SELECT, anon/authenticated, using true) je Tabelle |

Idempotenz: `create table if not exists` / `create index if not exists` / `drop … if exists` /
`do $$ … if not exists`. Auf Live No-Op, auf frischer DB strukturgleich.

## 2) Abweichungen

- Keine inhaltlichen. Migration 004 ist 1:1 zum Live-Schema.
- **Hinweis (kein Bau-Mangel, in der Migration selbst dokumentiert):** `projekte.beds24_api_key text`
  ist im Live-Schema ein Klartext-Secret-Feld (Migration zeichnet das nur nach + kommentiert es).
  Verschlüsselung steht im Backlog (API-Keys) — Sache von Konzept-Claude, nicht dieses Trackings.

## 3) Offen

- **Migration 004 NICHT gegen Live angewandt** (auftragsgemäß — No-Op, separater guardrail-pflichtiger
  Vorgang, nicht Teil dieses Auftrags). Sie wirkt mit dem nächsten Schema-Lauf / auf frischer DB.
- `akteure` selbst ist nicht Teil von 004 (eigene Migration); 004 referenziert sie nur konditional.

## 4) Rückfragen / Hinweise

- **Committet:** ja — Commit `33bb72d` (9 Dateien): `supabase/migrations/004_org_hierarchie.sql` +
  Modul-010-Specs (000/200/300) + `_INDEX.md` + `_LOG.md` + `_BACKLOG.md` + die zwei Prompts (1510/1545).
  NOTE + Extraktions-Report waren bereits in `25bb92c`.
- **Bewusst NICHT mit-committet** (nicht auf der Auftrags-Liste): `.docs/CLAUDE.md` (modifiziert) sowie
  die zwei älteren untracked Prompts `20260629_1130_prompt_fibu-historie-lieferant.md` und
  `20260629_1210_prompt_historie-felder-detailseiten.md`. Falls die auch in den nächsten Doku-Commit
  sollen, bitte kurz freigeben — ich fasse sie sonst nicht eigenmächtig an.
- Keine Tests/Build/Review-Subagent: reiner Verifikations-/Tracking-Commit ohne App-Code-Änderung
  (die SQL-Migration wird vom Vitest-Unit-Setup nicht gefahren). Verifikation erfolgte stattdessen
  programmatisch gegen Live (s. Abschnitt 1).
