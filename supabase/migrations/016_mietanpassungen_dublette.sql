-- =====================================================================
-- Migration 016: Namens-Dublette Mietrecht auflösen (Spec 0001)
--
-- Migration 002 legte `wimus.mietanpassungen` an; die Kern-DDL „005" nutzt
-- dagegen `wimus.mietpreiserhoehungen` (kanonisch, bekommt RLS in 009). Beide
-- sind im Code ungenutzt (grep: nur Spec-Doku) — `mietanpassungen` ist der
-- legacy-Stray und wird entfernt. `mietpreiserhoehungen` (§558/§559 BGB) bleibt
-- die maßgebliche Tabelle.
--
-- Idempotent (DROP ... IF EXISTS). Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

DROP TABLE IF EXISTS wimus.mietanpassungen CASCADE;

-- Kontrolle:
--   SELECT to_regclass('wimus.mietanpassungen');     -- erwartet: NULL
--   SELECT to_regclass('wimus.mietpreiserhoehungen'); -- erwartet: vorhanden
