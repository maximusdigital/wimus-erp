-- =====================================================================
-- Migration 022: Bank-Abgleich – Einstellungen + Ignorier-Muster je Mandant
--
-- Additiv + idempotent. Anwenden: SQL-Editor (nach 021).
--
-- bank_einstellungen: Confidence-Schwellen je Mandant (justierbar ohne Code-
-- Änderung, Defaults wie im Code). bank_ignorier_muster: pflegbare Vorfilter-
-- Teilstrings je Mandant (zusätzlich zu den Auto-Quellen firmen/bank_konten).
-- =====================================================================

SET search_path TO wimus, public;

CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- 1. Schwellen je Mandant (1 Zeile / Mandant)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.bank_einstellungen (
  mandant_id        UUID PRIMARY KEY REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  auto_schwelle     NUMERIC(3,2) NOT NULL DEFAULT 0.90,
  pruefen_schwelle  NUMERIC(3,2) NOT NULL DEFAULT 0.75,
  name_min          NUMERIC(3,2) NOT NULL DEFAULT 0.82,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. Manuelle Ignorier-Muster je Mandant (Vorfilter „kein Mietabgleich")
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.bank_ignorier_muster (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  muster      TEXT NOT NULL,           -- Teilstring (case-insensitive) in Zweck/Empfänger
  aktiv       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_ignorier_mandant ON wimus.bank_ignorier_muster(mandant_id);

-- ---------------------------------------------------------------------
-- 3. Trigger + RLS + Grants
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bank_einstellungen','bank_ignorier_muster'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON wimus.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON wimus.%1$s
                      FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at()', t);
    EXECUTE format('ALTER TABLE wimus.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS mandant_isolation ON wimus.%I', t);
    EXECUTE format($f$
      CREATE POLICY mandant_isolation ON wimus.%I
        FOR ALL TO authenticated
        USING (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
        WITH CHECK (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
    $f$, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.%I TO authenticated', t);
  END LOOP;
END $$;

-- Kontrolle: SELECT tablename FROM pg_tables WHERE schemaname='wimus'
--   AND tablename IN ('bank_einstellungen','bank_ignorier_muster');
