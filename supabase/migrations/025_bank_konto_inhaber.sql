-- =====================================================================
-- Migration 025: bank_konten.inhaber – echter Kontoinhabername (Vorfilter)
--
-- Additiv + idempotent. Anwenden: SQL-Editor.
--
-- `bezeichnung` ist nur ein Label; `inhaber` trägt den echten Kontoinhabernamen
-- fürs Vorfilter-Matching im Bank-Abgleich (eigene Umbuchungen erkennen).
-- Spec-Entscheidung 002_fibu_200 (2026-06-28).
-- =====================================================================

SET search_path TO wimus, public;

ALTER TABLE wimus.bank_konten ADD COLUMN IF NOT EXISTS inhaber TEXT;

-- Kontrolle: SELECT column_name FROM information_schema.columns
--   WHERE table_schema='wimus' AND table_name='bank_konten' AND column_name='inhaber';
