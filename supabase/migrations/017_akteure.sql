-- =====================================================================
-- Migration 017: Kern-Erweiterung (Spec 0001) – akteure (Mensch + KI)
--
-- Träger von Vorgängen/Aufgaben: Mensch ODER KI-Agent ODER extern. Erster Nutzer:
-- Modul 004 (ops). Quelle: 001_erp_200_datenmodell.md (§akteure).
--
-- WICHTIG: wimus.akteure existiert in der Live-DB bereits (untracked V501-Migration)
-- mit abweichendem Schema. Daher VOLL ADDITIV: CREATE TABLE IF NOT EXISTS (minimal)
-- + ADD COLUMN IF NOT EXISTS für jede benötigte Spalte. KEINE harte CHECK auf
-- bestehende Spalten (App/zod erzwingt die Werte). Indizes erst nach Spalten.
--
-- Idempotent. Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- akteure (additiv — Tabelle kann schon existieren)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.akteure (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID REFERENCES wimus.mandanten(id) ON DELETE CASCADE
);
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS mandant_id UUID
  REFERENCES wimus.mandanten(id) ON DELETE CASCADE;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS typ TEXT;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS kontakt_id UUID
  REFERENCES wimus.kontakte(id) ON DELETE SET NULL;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS benutzer_id UUID;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS organisation_id UUID
  REFERENCES wimus.organisationen(id) ON DELETE SET NULL;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS ki_modell TEXT;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS ki_konfidenz_schwelle NUMERIC(3,2);
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS bereich TEXT[] DEFAULT '{}';
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS aktiv BOOLEAN DEFAULT true;
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wimus.akteure ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_akteure_mandant ON wimus.akteure(mandant_id);
CREATE INDEX IF NOT EXISTS idx_akteure_typ ON wimus.akteure(typ);

-- ---------------------------------------------------------------------
-- akteur_verfuegbarkeit (additiv)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.akteur_verfuegbarkeit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  akteur_id   UUID REFERENCES wimus.akteure(id) ON DELETE CASCADE
);
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS mandant_id UUID
  REFERENCES wimus.mandanten(id) ON DELETE CASCADE;
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS akteur_id UUID
  REFERENCES wimus.akteure(id) ON DELETE CASCADE;
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS wochentag INT;
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS von_uhr TIME;
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS bis_uhr TIME;
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS max_stunden_woche INT;
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wimus.akteur_verfuegbarkeit ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_akteur_verfuegbarkeit_akteur ON wimus.akteur_verfuegbarkeit(akteur_id);

-- ---------------------------------------------------------------------
-- akteur_faehigkeiten (additiv)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.akteur_faehigkeiten (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  akteur_id   UUID REFERENCES wimus.akteure(id) ON DELETE CASCADE
);
ALTER TABLE wimus.akteur_faehigkeiten ADD COLUMN IF NOT EXISTS mandant_id UUID
  REFERENCES wimus.mandanten(id) ON DELETE CASCADE;
ALTER TABLE wimus.akteur_faehigkeiten ADD COLUMN IF NOT EXISTS akteur_id UUID
  REFERENCES wimus.akteure(id) ON DELETE CASCADE;
ALTER TABLE wimus.akteur_faehigkeiten ADD COLUMN IF NOT EXISTS faehigkeit TEXT;
ALTER TABLE wimus.akteur_faehigkeiten ADD COLUMN IF NOT EXISTS level INT;
ALTER TABLE wimus.akteur_faehigkeiten ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE wimus.akteur_faehigkeiten ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_akteur_faehigkeiten_akteur ON wimus.akteur_faehigkeiten(akteur_id);

-- ---------------------------------------------------------------------
-- Trigger + RLS + Grants (idempotent; greift auch auf vorbestehende Tabellen)
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['akteure','akteur_verfuegbarkeit','akteur_faehigkeiten'] LOOP
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

-- Kontrolle:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_schema='wimus' AND table_name='akteure' ORDER BY ordinal_position;
