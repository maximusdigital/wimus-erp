-- =====================================================================
-- Migration 010: FiBu (Spec 0002) – Stammdaten-Layer (Grobplan Schritt 1+2)
--
-- Umfang: Steuerstruktur (Gesellschafter/Beteiligungen, Firmen-Erweiterung)
-- + Kontenrahmen/Kontierungsregeln/Lieferanten. Belege/Buchungen (Schritt 3)
-- folgen separat, sobald die offenen Punkte (EXTF-Layout, Confidence-Schwellen)
-- der 0.1.0-Grobspec fixiert sind.
--
-- Annahme (Spec-OP "einheiten neu oder firmen erweitern"): Buchungskreis =
-- bestehende wimus.firmen (hat bereits rechtsform/steuernummer/datev_*/
-- wirtschaftsjahr/ust_*). Hier nur additiv ergänzt. FiBu-Tabellen tragen
-- mandant_id (RLS-Konsistenz) + firma_id (Buchungskreis).
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS). Anwenden: SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- ---------------------------------------------------------------------
-- 1. Firmen-Erweiterung (Buchungskreis-Steuermerkmale)
-- ---------------------------------------------------------------------
ALTER TABLE wimus.firmen ADD COLUMN IF NOT EXISTS rechtsform_typ TEXT
  CHECK (rechtsform_typ IS NULL OR rechtsform_typ IN ('kapitalgesellschaft','personengesellschaft','privat'));
ALTER TABLE wimus.firmen ADD COLUMN IF NOT EXISTS besteuerungsart TEXT
  CHECK (besteuerungsart IS NULL OR besteuerungsart IN ('bilanz','euer','ueberschuss'));
ALTER TABLE wimus.firmen ADD COLUMN IF NOT EXISTS kontenrahmen_ref TEXT;

-- Hilfs-Trigger (updated_at) – konfliktfrei, eigene Funktion.
CREATE OR REPLACE FUNCTION wimus.fibu_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- 2. Gesellschafter
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.gesellschafter (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id      UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  typ             TEXT NOT NULL DEFAULT 'natuerliche_person'
                    CHECK (typ IN ('natuerliche_person','juristische_person')),
  steuerliche_id  TEXT,
  strasse         TEXT, hausnummer TEXT, plz TEXT, stadt TEXT, land TEXT DEFAULT 'DE',
  aktiv           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. Beteiligungen (zeitabhängige Quoten → periodengenaue Verteilung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.beteiligungen (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id        UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  gesellschafter_id UUID NOT NULL REFERENCES wimus.gesellschafter(id) ON DELETE CASCADE,
  firma_id          UUID NOT NULL REFERENCES wimus.firmen(id) ON DELETE CASCADE,
  quote             NUMERIC(7,4) NOT NULL CHECK (quote >= 0 AND quote <= 1),
  gueltig_ab        DATE NOT NULL,
  gueltig_bis       DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (gueltig_bis IS NULL OR gueltig_bis >= gueltig_ab)
);
CREATE INDEX IF NOT EXISTS idx_beteiligungen_firma ON wimus.beteiligungen(firma_id);
CREATE INDEX IF NOT EXISTS idx_beteiligungen_ges ON wimus.beteiligungen(gesellschafter_id);

-- ---------------------------------------------------------------------
-- 4. Kontenrahmen / Konten (pro Buchungskreis; SKR ≠ EÜR)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.fibu_konten (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id    UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id      UUID REFERENCES wimus.firmen(id) ON DELETE CASCADE,
  kontonummer   TEXT NOT NULL,
  bezeichnung   TEXT NOT NULL,
  kontoart      TEXT CHECK (kontoart IS NULL OR kontoart IN ('soll','haben','automatik')),
  skr_basis     TEXT CHECK (skr_basis IS NULL OR skr_basis IN ('skr03','skr04','euer')),
  ust_automatik TEXT,
  aktiv         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firma_id, kontonummer)
);

-- ---------------------------------------------------------------------
-- 5. Kontierungsregeln (Workspace-Default ↔ Firma-Override)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kontierungsregeln (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id      UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  scope           TEXT NOT NULL DEFAULT 'workspace' CHECK (scope IN ('workspace','einheit')),
  firma_id        UUID REFERENCES wimus.firmen(id) ON DELETE CASCADE,
  match           TEXT NOT NULL,
  soll_konto      TEXT NOT NULL,
  haben_logik     TEXT,
  ust_satz        NUMERIC(5,2),
  steuerschluessel TEXT,
  prioritaet      INT NOT NULL DEFAULT 100,
  aktiv           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kontierungsregeln_prio ON wimus.kontierungsregeln(prioritaet);

-- ---------------------------------------------------------------------
-- 6. Lieferanten / Kreditoren (mit Alias-Fuzzy-Keys)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.lieferanten (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id      UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id        UUID REFERENCES wimus.firmen(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  alias           TEXT[] DEFAULT '{}',
  ustid           TEXT,
  iban            TEXT,
  standard_gewerk TEXT,
  standard_konto  TEXT,
  aktiv           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- updated_at-Trigger + RLS (mandant_isolation) für alle vier Tabellen
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['gesellschafter','beteiligungen','fibu_konten','kontierungsregeln','lieferanten'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON wimus.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON wimus.%1$s
                      FOR EACH ROW EXECUTE FUNCTION wimus.fibu_touch_updated_at()', t);
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
--   AND tablename IN ('gesellschafter','beteiligungen','fibu_konten','kontierungsregeln','lieferanten');
