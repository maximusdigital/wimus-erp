-- =====================================================================
-- Migration 030: Tags — Kern-Querschnitt (tags + tag_zuordnung), Modul 001_erp
--
-- Freies, typenloses Label-System QUER über ALLE Bausteine (Backlog #22 → Kern).
-- n:m, polymorph (Muster wie custom_field_werte / aktivitaet_bezug). KEIN eigenes
-- Modul, KEINE bezug_typ-Whitelist, KEIN FK auf bezug_id, KEINE workspace-Spalte
-- (mandant ist die RLS-Wurzel), KEIN Tag-Typ/Wert/Hierarchie, KEIN Seed.
--
-- Spec: 001_erp_200_datenmodell.md, Abschnitt „Tags (Kern-Querschnitt …)".
-- Voll ADDITIV + idempotent. Unabhängig von #21. RLS/Grants nach 027-Muster.
-- =====================================================================

SET search_path TO wimus, public;

-- Trigger-Funktion (idempotent, identisch zu 027/018/017).
CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- 1) tags — das Label selbst (mandant ist RLS-Wurzel)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  farbe      TEXT,                                  -- UI-Chip-Farbe, optional
  aktiv      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- case-insensitive eindeutig je Mandant: „Wasserschaden" == „wasserschaden".
CREATE UNIQUE INDEX IF NOT EXISTS ux_tags_mandant_label
  ON wimus.tags (mandant_id, lower(label));

DROP TRIGGER IF EXISTS trg_tags_touch ON wimus.tags;
CREATE TRIGGER trg_tags_touch BEFORE UPDATE ON wimus.tags
  FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at();

-- ---------------------------------------------------------------------
-- 2) tag_zuordnung — polymorphe n:m-Verknüpfung (KEIN FK auf bezug_id,
--    bezug_typ ist freier String, KEINE Whitelist). Kein updated_at.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.tag_zuordnung (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id     UUID NOT NULL REFERENCES wimus.tags(id) ON DELETE CASCADE,
  bezug_typ  TEXT NOT NULL,                         -- objekt/einheit/buchung/… (frei)
  bezug_id   UUID NOT NULL,                         -- polymorph, KEIN FK
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ein Tag nur einmal pro Datensatz.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tag_zuordnung
  ON wimus.tag_zuordnung (tag_id, bezug_typ, bezug_id);
-- „welche Tags hat dieser Datensatz?" (tag_id-Index entsteht über den FK ohnehin).
CREATE INDEX IF NOT EXISTS ix_tag_zuordnung_bezug
  ON wimus.tag_zuordnung (bezug_typ, bezug_id);

-- ---------------------------------------------------------------------
-- 3) RLS (mandant_isolation) + Grants (Muster 027)
-- ---------------------------------------------------------------------
-- 3a) tags: direkte mandant_isolation über eigene mandant_id.
ALTER TABLE wimus.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.tags;
CREATE POLICY mandant_isolation ON wimus.tags
  FOR ALL TO authenticated
  USING (mandant_id IN (SELECT wimus.user_mandanten()))
  WITH CHECK (mandant_id IN (SELECT wimus.user_mandanten()));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.tags TO authenticated;
GRANT ALL ON wimus.tags TO service_role;

-- 3b) tag_zuordnung: erbt den Mandanten über das Eltern-Tag (wie custom_field_value_option).
ALTER TABLE wimus.tag_zuordnung ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.tag_zuordnung;
CREATE POLICY mandant_isolation ON wimus.tag_zuordnung
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wimus.tags t
                 WHERE t.id = tag_zuordnung.tag_id
                   AND t.mandant_id IN (SELECT wimus.user_mandanten())))
  WITH CHECK (EXISTS (SELECT 1 FROM wimus.tags t
                 WHERE t.id = tag_zuordnung.tag_id
                   AND t.mandant_id IN (SELECT wimus.user_mandanten())));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.tag_zuordnung TO authenticated;
GRANT ALL ON wimus.tag_zuordnung TO service_role;

-- =====================================================================
-- Kontrolle nach dem Lauf:
--   SELECT to_regclass('wimus.tags'), to_regclass('wimus.tag_zuordnung');
--   SELECT relname, relrowsecurity FROM pg_class
--     WHERE relnamespace='wimus'::regnamespace AND relname IN ('tags','tag_zuordnung');
--   SELECT indexname FROM pg_indexes WHERE schemaname='wimus'
--     AND tablename IN ('tags','tag_zuordnung') ORDER BY indexname;
-- Smoke (service_role): INSERT Test-Tag + Zuordnung, dann wieder löschen.
-- =====================================================================
