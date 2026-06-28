-- =====================================================================
-- Migration 020: Manuelle Board-Sortierung (Kanban, @dnd-kit/sortable)
--
-- Additiv + idempotent. Anwenden: SQL-Editor.
--
-- board_sort trägt die manuell per Drag gesetzte Reihenfolge INNERHALB einer
-- Spalte (Plantafel: je Status; CRM: je Stage). Reorder-Endpoints schreiben
-- board_sort = Position (0..n). Spaltenwechsel bleibt über Status/Stage.
-- =====================================================================

SET search_path TO wimus, public;

ALTER TABLE wimus.vorgaenge  ADD COLUMN IF NOT EXISTS board_sort INT NOT NULL DEFAULT 0;
ALTER TABLE wimus.crm_deals  ADD COLUMN IF NOT EXISTS board_sort INT NOT NULL DEFAULT 0;

-- Sortier-Indizes je Spaltenschlüssel.
CREATE INDEX IF NOT EXISTS idx_vorgaenge_board_sort ON wimus.vorgaenge(status, board_sort);
CREATE INDEX IF NOT EXISTS idx_crm_deals_board_sort  ON wimus.crm_deals(stage_id, board_sort);

-- Kontrolle: SELECT column_name FROM information_schema.columns
--   WHERE table_schema='wimus' AND table_name IN ('vorgaenge','crm_deals') AND column_name='board_sort';
