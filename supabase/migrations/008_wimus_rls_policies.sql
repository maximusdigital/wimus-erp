-- =====================================================================
-- Migration 008: RLS-Policies (mandant_isolation) für wimus-Geschäftstabellen
--
-- Befund 2026-06-25: In wimus ist RLS aktiviert, aber es existieren KEINE
-- Policies → anon/authenticated sehen 0 Zeilen (Service-Role umgeht RLS).
-- Ohne diese Policies bleibt die App nach dem public→wimus-Repoint leer.
--
-- Muster wie public: Zugriff auf Zeilen des/der Mandanten des Users
-- (Zuordnung in public.user_mandanten). einheiten hat KEIN mandant_id →
-- Isolation über das zugehörige Objekt.
--
-- Idempotent (DROP POLICY IF EXISTS). Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- Helper-Ausdruck (inline): erlaubte mandant_ids des aktuellen Users.
--   mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())

-- ---------------------------------------------------------------------
-- 1) Tabellen MIT mandant_id → Standard-Isolation (FOR ALL).
-- ---------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tabs text[] := ARRAY[
    'gesellschaften','objekte','kontakte','vorgaenge','mietvertraege',
    'buchungen','kautionen','mahnungen','vorlagen','citytax_buchungen',
    'forderungen','fristen'
  ];
BEGIN
  FOREACH t IN ARRAY tabs LOOP
    -- Tabelle könnte (noch) fehlen → tolerant.
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

-- ---------------------------------------------------------------------
-- 2) mandanten selbst → über eigene id.
-- ---------------------------------------------------------------------
ALTER TABLE wimus.mandanten ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.mandanten;
CREATE POLICY mandant_isolation ON wimus.mandanten
  FOR ALL TO authenticated
  USING (id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
  WITH CHECK (id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 3) einheiten → kein mandant_id, Isolation über Objekt.
-- ---------------------------------------------------------------------
ALTER TABLE wimus.einheiten ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.einheiten;
CREATE POLICY mandant_isolation ON wimus.einheiten
  FOR ALL TO authenticated
  USING (objekt_id IN (
    SELECT id FROM wimus.objekte
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ))
  WITH CHECK (objekt_id IN (
    SELECT id FROM wimus.objekte
    WHERE mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())
  ));

-- Kontrolle: SELECT tablename, policyname FROM pg_policies WHERE schemaname='wimus';
