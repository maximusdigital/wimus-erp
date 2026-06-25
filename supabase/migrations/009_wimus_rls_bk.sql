-- =====================================================================
-- Migration 009: RLS-Policies (mandant_isolation) für die BK-Tabellen
--
-- Befund 2026-06-26: bk_arten / abrechnungseinheiten / kostenverteilung_
-- positionen / bk_abrechnungen / abrechnungseinheit_mitglieder haben RLS
-- aktiv (aus Migration 005), aber KEINE Policy → der angemeldete Nutzer
-- sieht 0 Zeilen (Service-Role umgeht RLS). 008 deckte nur forderungen/
-- fristen u.a. ab. Diese Migration ergänzt die BK-Tabellen.
--
-- Idempotent. Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- Tabellen MIT mandant_id → Standard-Isolation.
DO $$
DECLARE
  t text;
  tabs text[] := ARRAY[
    'bk_arten','bk_berechnungslogiken','abrechnungseinheiten',
    'kostenverteilung_positionen','bk_abrechnungen','bk_abrechnungs_positionen',
    'mietpreiserhoehungen','kautionsabrechnungen','vertrags_parameter_definitionen'
  ];
BEGIN
  FOREACH t IN ARRAY tabs LOOP
    IF to_regclass('wimus.'||t) IS NULL THEN CONTINUE; END IF;
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

-- abrechnungseinheit_mitglieder → kein mandant_id, Isolation über die
-- Abrechnungseinheit.
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
