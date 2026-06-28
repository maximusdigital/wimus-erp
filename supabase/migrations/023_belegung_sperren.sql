-- =====================================================================
-- Migration 023: Belegungs-Sperren (Kern 0001) – manuelle Belegungsquelle
--
-- Additiv + idempotent. Anwenden: SQL-Editor.
--
-- Dritte Belegungsquelle neben buchungen (KZV) und mietvertraege (regulär):
-- manuelle Sperren (Renovierung/Eigennutzung/gewollter Leerstand). Die
-- Verfügbarkeits-Engine (lib/belegung/verfuegbarkeit.ts) prüft Overlap über alle drei.
-- =====================================================================

SET search_path TO wimus, public;

CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS wimus.belegung_sperren (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id           UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  einheit_id           UUID NOT NULL REFERENCES wimus.einheiten(id) ON DELETE CASCADE,
  von                  DATE NOT NULL,
  bis                  DATE,                       -- NULL = offen/unbefristet
  grund                TEXT NOT NULL DEFAULT 'sonstiges' CHECK (grund IN
                         ('renovierung','eigennutzung','leerstand_gewollt','sonstiges')),
  notiz                TEXT,
  beds24_geblockt      BOOLEAN NOT NULL DEFAULT false,  -- nach Beds24 gespiegelt (Hook, später)
  created_by_akteur_id UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (bis IS NULL OR bis >= von)
);
CREATE INDEX IF NOT EXISTS idx_belegung_sperren_einheit ON wimus.belegung_sperren(einheit_id, von);
CREATE INDEX IF NOT EXISTS idx_belegung_sperren_mandant ON wimus.belegung_sperren(mandant_id);

DROP TRIGGER IF EXISTS trg_belegung_sperren_touch ON wimus.belegung_sperren;
CREATE TRIGGER trg_belegung_sperren_touch BEFORE UPDATE ON wimus.belegung_sperren
  FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at();

ALTER TABLE wimus.belegung_sperren ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.belegung_sperren;
CREATE POLICY mandant_isolation ON wimus.belegung_sperren
  FOR ALL TO authenticated
  USING (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
  WITH CHECK (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.belegung_sperren TO authenticated;

-- Kontrolle: SELECT * FROM pg_tables WHERE schemaname='wimus' AND tablename='belegung_sperren';
