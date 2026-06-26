-- =====================================================================
-- Migration 015: FiBu (Spec 0002) – Auswertung/Konsolidierung
--
-- feststellungen (Persistenz der Controlling-Vorschau), auswertungs_scopes
-- (gespeicherte Scope-Presets), objekt_tags (Gruppierung horizontale Achse),
-- reporting_taxonomie (neutrales Berichtsraster SKR03↔EÜR).
--
-- Quelle: 002_fibu_200_datenmodell.md (§feststellungen / §Auswertungs-Scopes).
-- ANPASSUNG ggü. Grobspec: Buchungskreis = firma_id (REFERENCES firmen) statt
-- "einheit_id" – konsistent mit FiBu 010/011 (firma = Buchungskreis). akteur_id/
-- gespeichert_von als bare UUID. created_at/updated_at (Kern-Konvention).
-- Setzt 010/014 voraus (touch_updated_at). Idempotent. SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- feststellungen (Controlling-Vorschau, persistiert; nicht steuerverbindlich)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.feststellungen (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id         UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id           UUID REFERENCES wimus.firmen(id) ON DELETE CASCADE,
  periode_von        DATE NOT NULL,
  periode_bis        DATE NOT NULL,
  ermitteltes_ergebnis NUMERIC(14,2),
  verteilung         JSONB NOT NULL DEFAULT '[]'::jsonb,
  akteur_id          UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (periode_bis >= periode_von)
);
CREATE INDEX IF NOT EXISTS idx_feststellungen_firma ON wimus.feststellungen(firma_id);

-- ---------------------------------------------------------------------
-- auswertungs_scopes (gespeicherte Presets für den Scope-Selektor)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.auswertungs_scopes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id      UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  einheiten_set   UUID[] NOT NULL DEFAULT '{}',
  k1_set          TEXT[] NOT NULL DEFAULT '{}',
  zeitraum_typ    TEXT,
  optionen        JSONB NOT NULL DEFAULT '{}'::jsonb,
  gespeichert_von UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- objekt_tags (Gruppierung für die horizontale Achse, K1)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.objekt_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  objekt_id   UUID NOT NULL REFERENCES wimus.objekte(id) ON DELETE CASCADE,
  tag_typ     TEXT NOT NULL CHECK (tag_typ IN ('nutzungsart','marke','region')),
  wert        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (objekt_id, tag_typ, wert)
);
CREATE INDEX IF NOT EXISTS idx_objekt_tags_objekt ON wimus.objekt_tags(objekt_id);

-- ---------------------------------------------------------------------
-- reporting_taxonomie (neutrales Berichtsraster: SKR03/EÜR → Position)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.reporting_taxonomie (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id    UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  position_code TEXT NOT NULL,
  bezeichnung   TEXT NOT NULL,
  mapping       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mandant_id, position_code)
);

-- ---------------------------------------------------------------------
-- Trigger + RLS + Grants für alle vier Tabellen
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['feststellungen','auswertungs_scopes','objekt_tags','reporting_taxonomie'] LOOP
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
--   AND tablename IN ('feststellungen','auswertungs_scopes','objekt_tags','reporting_taxonomie');
