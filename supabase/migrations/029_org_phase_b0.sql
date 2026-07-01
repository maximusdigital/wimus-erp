-- =====================================================================
-- Migration 029: Org Phase B0 — firmen.typ CHECK-Liste (#21)
--
-- REDUZIERT (2026-06-29 21:05, Konzept-Claude-Entscheidung nach Apply-Stopp,
--    Report 2045): B0 enthält NUR noch den abhängigkeitsfreien firmen.typ-
--    CHECK-Swap. Der ursprünglich geplante `projekte.marke`-Drop wandert nach
--    PHASE D — er hängt an der untracked View `wimus.v_projekt_effektiv`
--    (rekursive CI-Vererbung, referenziert marke) UND am `marke`-Feld in
--    `components/einstellungen/projekt-form.tsx`. Das ist ein eigener, getesteter
--    Schritt (View droppen + ohne marke neu anlegen + tracken + App-Change),
--    KEIN B0-Stammdaten-Schritt.
--
-- 🚪 Freigabe: DB-Backup bestätigt weggesichert (Report 2045). typ-Werte je Firma
--    werden über die UI gepflegt, NICHT hier. → 029 setzt nur die CHECK-Struktur.
--
-- Fasst KEINE Bestandsdaten an. Idempotent (drop constraint if exists + re-add).
-- NIE Fast-Path. search_path wimus.
-- =====================================================================

set search_path to wimus, public;

-- firmen.typ — CHECK-Liste umstellen (NEUE Liste, Max 2026-06-29):
--   privat = Privatperson · Einzelunternehmung (Substantiv) · GbR · GmbH.
--   GbR/GmbH = „mit Anteilen" → Anteile via gesellschafter + beteiligungen (Mig. 010).
-- Alle firmen.typ sind aktuell NULL (verifiziert) → Umstellung sicher, NULL bleibt erlaubt.
-- Werte je Firma werden NICHT hier gesetzt (UI).
alter table wimus.firmen drop constraint if exists firmen_typ_check;
alter table wimus.firmen
  add constraint firmen_typ_check
  check (typ is null or typ in ('privat','Einzelunternehmung','GbR','GmbH'));

-- Kontrolle nach dem Lauf:
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid='wimus.firmen'::regclass and conname='firmen_typ_check';  -- → neue Liste
--   select kuerzel, typ from wimus.firmen order by kuerzel;                    -- → typ weiter NULL
-- =====================================================================
