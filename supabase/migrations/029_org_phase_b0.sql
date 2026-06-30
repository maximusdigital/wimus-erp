-- =====================================================================
-- Migration 029: Org Phase B0 — Seed-Korrektur projekte/firmen (#21)
--
-- ⚠️ ERSTER schreibender Schritt von #21 Phase B. Fasst BEWUSST KEINE
--    Bestandsdaten an (objekte/einheiten/mietvertraege/buchungen) — nur die
--    projekte/firmen-Stammdatenwelt. Risikoärmster Einstieg.
--
-- 🚪 TOR: NUR anwenden, wenn (a) Max das DB-Backup bestätigt hat UND (b) die
--    firmen.typ-Werteliste freigegeben ist. Solange offen: NUR Datei + SQL im
--    Report zeigen, NICHT über /pg/query ausführen. (Guardrail: exakte SQL →
--    explizite Freigabe → erst dann anwenden.) Stand Commit: NICHT angewandt.
--
-- Quelle Fakten: .docs/_NOTE_org-phase-b-vorlauf.md (Report 1745) +
--    .docs/_NOTE_b0-firmen-typ-offen.md (neue typ-Liste, Max 2026-06-29 18:30).
--
-- Enthalten (ENTSCHIEDEN):
--   1) projekte.marke droppen — real 0/7 befüllt (verifiziert), kein Inhalt verloren.
--   2) firmen.typ CHECK-Liste auf die NEUE Werteliste umstellen
--      (privat / Einzelunternehmung / GbR / GmbH) — ersetzt die alte Liste
--      (privat/operativ/vvGmbH/GbR/holding/sonstige). Alle typ aktuell NULL → sicher.
--
-- NICHT enthalten (GEPARKT, bewusst nicht geraten):
--   - firmen.typ je Firma SETZEN — die Zuordnung (MMP/WIM/VVG → welcher typ) ist
--     von Max ausdrücklich vertagt (s. _NOTE_b0-firmen-typ-offen.md #3). Folgt als
--     separater UPDATE, sobald Max die Zuordnung freigibt.
--   - projekte.pfad füllen → Backlog #23.
--   - ALFA DEVELOPMENT anlegen / MFHSO/ABHS21A umhängen → war nur Diskussionsbeispiel, NICHT B0.
--
-- Idempotent (drop column/constraint if exists). NIE Fast-Path. search_path wimus.
-- =====================================================================

set search_path to wimus, public;

-- ---------------------------------------------------------------------
-- 1) projekte.marke entfernen (0/7 befüllt — „Marke"-Konzept raus, #21 Punkt 2)
--    Re-Check vor Anwendung empfohlen: SELECT count(marke) FROM wimus.projekte; → 0
-- ---------------------------------------------------------------------
alter table wimus.projekte drop column if exists marke;

-- ---------------------------------------------------------------------
-- 2) firmen.typ — CHECK-Liste umstellen (NEUE Liste, Max 2026-06-29)
--    privat = Privatperson · Einzelunternehmung (Substantiv) · GbR · GmbH.
--    GbR/GmbH = „mit Anteilen" → Anteile via gesellschafter + beteiligungen (Mig. 010).
--    Werte je Firma werden NICHT hier gesetzt (geparkt, s. Header).
-- ---------------------------------------------------------------------
alter table wimus.firmen drop constraint if exists firmen_typ_check;
alter table wimus.firmen
  add constraint firmen_typ_check
  check (typ is null or typ in ('privat','Einzelunternehmung','GbR','GmbH'));

-- ---------------------------------------------------------------------
-- GEPARKT — erst nach Max-Freigabe der Zuordnung als Folge-UPDATE (NICHT raten):
--   update wimus.firmen set typ = '‹?›' where kuerzel = 'MMP' and typ is null;  -- Maxim Moser
--   update wimus.firmen set typ = '‹?›' where kuerzel = 'WIM' and typ is null;  -- WIMUS GmbH
--   update wimus.firmen set typ = '‹?›' where kuerzel = 'VVG' and typ is null;  -- WIMUS vvGmbH
-- ---------------------------------------------------------------------

-- Kontrolle nach dem Lauf:
--   select count(*) from information_schema.columns
--     where table_schema='wimus' and table_name='projekte' and column_name='marke';  -- → 0
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid='wimus.firmen'::regclass and conname='firmen_typ_check';
-- =====================================================================
