-- =====================================================================
-- Migration 009: RLS-Policies (mandant_isolation) für die BK-Tabellen
--
-- Befund 2026-06-26: BK-Tabellen (aus Migration 005) haben RLS aktiv, aber
-- KEINE Policy → der angemeldete Nutzer sieht 0 Zeilen (Service-Role umgeht
-- RLS). 008 deckte nur forderungen/fristen u.a. ab.
--
-- Achtung: nicht alle BK-Tabellen haben mandant_id. Kind-Tabellen werden
-- über ihre Eltern isoliert:
--   bk_berechnungslogiken     → bk_art_id  → bk_arten.mandant_id
--   bk_abrechnungs_positionen → abrechnung_id → bk_abrechnungen.mandant_id
--   abrechnungseinheit_mitglieder → abrechnungseinheit_id → abrechnungseinheiten.mandant_id
--
-- Idempotent. Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- Tabellen MIT mandant_id → Standard-Isolation (Spalten-Existenz wird geprüft,
-- damit die Migration nie an einer mandant_id-losen Tabelle scheitert).
DO $$
DECLARE
  t text;
  tabs text[] := ARRAY[
    'bk_arten','abrechnungseinheiten','kostenverteilung_positionen',
    'bk_abrechnungen','mietpreiserhoehungen','kautionsabrechnungen',
    'vertrags_parameter_definitionen'
  ];
BEGIN
  FOREACH t IN ARRAY tabs LOOP
    IF to_regclass('wimus.'||t) IS NULL THEN CONTINUE; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='wimus' AND table_name=t AND column_name='mandant_id'
    ) THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE wimus.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS mandant_isolation ON wimus.%I', t);
    EXECUTE format($f$
      CREATE POLICY mandant_isolation ON wimus.%I
        FOR ALL TO authenticated
        USING (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
        WITH CHECK (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
    $f$, t);
  END LOOP;
END $$;

-- Kind-Tabellen ohne mandant_id → Isolation über die Elterntabelle.

-- bk_berechnungslogiken → bk_arten
ALTER TABLE wimus.bk_berechnungslogiken ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.bk_berechnungslogiken;
CREATE POLICY mandant_isolation ON wimus.bk_berechnungslogiken
  FOR ALL TO authenticated
  USING (bk_art_id IN (
    SELECT id FROM wimus.bk_arten
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ))
  WITH CHECK (bk_art_id IN (
    SELECT id FROM wimus.bk_arten
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ));

-- bk_abrechnungs_positionen → bk_abrechnungen
ALTER TABLE wimus.bk_abrechnungs_positionen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.bk_abrechnungs_positionen;
CREATE POLICY mandant_isolation ON wimus.bk_abrechnungs_positionen
  FOR ALL TO authenticated
  USING (abrechnung_id IN (
    SELECT id FROM wimus.bk_abrechnungen
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ))
  WITH CHECK (abrechnung_id IN (
    SELECT id FROM wimus.bk_abrechnungen
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ));

-- abrechnungseinheit_mitglieder → abrechnungseinheiten
ALTER TABLE wimus.abrechnungseinheit_mitglieder ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.abrechnungseinheit_mitglieder;
CREATE POLICY mandant_isolation ON wimus.abrechnungseinheit_mitglieder
  FOR ALL TO authenticated
  USING (abrechnungseinheit_id IN (
    SELECT id FROM wimus.abrechnungseinheiten
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ))
  WITH CHECK (abrechnungseinheit_id IN (
    SELECT id FROM wimus.abrechnungseinheiten
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ));

-- Kontrolle: SELECT tablename, policyname FROM pg_policies WHERE schemaname='wimus' AND tablename LIKE 'bk%';
