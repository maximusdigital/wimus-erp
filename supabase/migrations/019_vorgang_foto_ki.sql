-- =====================================================================
-- Migration 019: Modul 004 (ops) – KI-Bildanalyse an vorgang_foto
--
-- Setzt 018 (vorgang_foto) voraus. Additiv + idempotent. Anwenden: SQL-Editor.
--
-- Übergabe-Fotos werden von Claude Vision ausgewertet (Zählerstand-Foto →
-- strukturierte Zählerstände; Vorher/Nachher → Schadensvorschläge). Das
-- strukturierte Ergebnis (JSON), die Modell-Confidence (0..1) und der
-- Routing-Status (auto/pruefen/manuell) liegen am Foto. KEINE Vermischung
-- mit Mistral (das bleibt FiBu/Belege-only).
-- =====================================================================

SET search_path TO wimus, public;

-- Strukturiertes, schema-validiertes Analyse-Ergebnis (z. B. {zaehler:[…]} oder {schaeden:[…]}).
ALTER TABLE wimus.vorgang_foto ADD COLUMN IF NOT EXISTS ki_analyse JSONB;
-- Selbsteinschätzung des Modells, 0..1.
ALTER TABLE wimus.vorgang_foto ADD COLUMN IF NOT EXISTS ki_confidence NUMERIC(3,2);
-- Confidence-Routing wie OCR-Pipeline: ≥0.90 auto · 0.75–0.89 pruefen · <0.75 manuell.
-- Kritische Felder (Zählerstand→Abrechnung) NIE auto → mindestens pruefen.
ALTER TABLE wimus.vorgang_foto ADD COLUMN IF NOT EXISTS ki_status TEXT
  CHECK (ki_status IS NULL OR ki_status IN ('auto','pruefen','manuell'));
ALTER TABLE wimus.vorgang_foto ADD COLUMN IF NOT EXISTS ki_analysiert_am TIMESTAMPTZ;

-- Kontrolle: SELECT column_name FROM information_schema.columns
--   WHERE table_schema='wimus' AND table_name='vorgang_foto' AND column_name LIKE 'ki_%';
