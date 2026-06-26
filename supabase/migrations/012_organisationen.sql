-- =====================================================================
-- Migration 012: Kern-Erweiterung (Spec 0001) – Organisationen (externe Firmen)
--
-- Variante B (relational): externe Geschäftsfirmen (Eigentümer-Firma, Makler,
-- Bauträger, Lieferant) als eigener Stamm, mit n Ansprechpartnern je Firma über
-- kontakte.organisation_id. WICHTIG: externe Firma (organisationen, AUSSEN) ist
-- NICHT der eigene Buchungskreis/Mandant (firmen, INNEN). amoCRM vermischt beides
-- in "Companies" – wir trennen es bewusst (siehe 0001/20_datenmodell, 0003/00_konzept).
--
-- Voraussetzung für CRM (0003): deals.organisation_id referenziert diese Tabelle.
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS). Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- Hilfs-Trigger (updated_at) – eigene, konfliktfreie Funktion (analog fibu_touch_updated_at).
CREATE OR REPLACE FUNCTION wimus.crm_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- organisationen (externe Geschäftspartner, AUSSEN)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.organisationen (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  typ         TEXT CHECK (typ IS NULL OR typ IN
                ('eigentuemer','makler','bautraeger','lieferant','investor','sonstige')),
  strasse     TEXT, hausnummer TEXT, plz TEXT, stadt TEXT, stadtteil TEXT, land TEXT DEFAULT 'DE',
  email       TEXT,
  telefon     TEXT,
  website     TEXT,
  ustid       TEXT,
  notiz       TEXT,
  aktiv       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_organisationen_mandant ON wimus.organisationen(mandant_id);
CREATE INDEX IF NOT EXISTS idx_organisationen_name ON wimus.organisationen(name);

-- ---------------------------------------------------------------------
-- kontakte.organisation_id (Person gehört zu externer Firma; mehrere je Firma)
-- ---------------------------------------------------------------------
ALTER TABLE wimus.kontakte
  ADD COLUMN IF NOT EXISTS organisation_id UUID
  REFERENCES wimus.organisationen(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_kontakte_organisation ON wimus.kontakte(organisation_id);

-- ---------------------------------------------------------------------
-- Trigger + RLS (mandant_isolation) + Grants
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_organisationen_touch ON wimus.organisationen;
CREATE TRIGGER trg_organisationen_touch BEFORE UPDATE ON wimus.organisationen
  FOR EACH ROW EXECUTE FUNCTION wimus.crm_touch_updated_at();

ALTER TABLE wimus.organisationen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.organisationen;
CREATE POLICY mandant_isolation ON wimus.organisationen
  FOR ALL TO authenticated
  USING (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
  WITH CHECK (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.organisationen TO authenticated;

-- Kontrolle:
--   SELECT to_regclass('wimus.organisationen');
--   SELECT column_name FROM information_schema.columns
--     WHERE table_schema='wimus' AND table_name='kontakte' AND column_name='organisation_id';
