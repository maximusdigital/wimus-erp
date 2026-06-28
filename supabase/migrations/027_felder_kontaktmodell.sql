-- =====================================================================
-- Migration 027: Modul 008 (felder) – Custom-Field-Schicht (Variante C)
--                + Kontaktmodell-Typen (n:m) + Person↔Organisation (n:m)
--
-- Spec: 008_felder_000/200/300. Voll ADDITIV + idempotent (Supabase SQL-Editor).
--
-- REALITÄT (gegen Schema verifiziert, s. Report 20260628_..._report_felder.md):
--  * wimus.kontakte ist Single-Table-polymorph (kontakt_typ 'person'|'firma'
--    + Rollen-Flags ist_mieter/ist_eigentuemer/…) — wird NICHT umgebaut.
--    "Person" = kontakte(kontakt_typ='person'); "Organisation" = wimus.organisationen
--    (Migration 012, externe Firmen). Beide existieren bereits.
--  * Speicher-Variante C (typisierte EAV-Wert-Spalten) gewählt — Begründung im Report.
--    Wir ERWEITERN die bestehenden, bislang ungenutzten 002-Tabellen
--    custom_field_definitionen / custom_field_werte statt neue daneben zu bauen.
--  * "Lieferant" bleibt zweigleisig: wimus.lieferanten = Buchungs-Kreditor (FiBu,
--    standard_konto/firma_id/alias), Kontakt-/Org-Typ 'lieferant' = Geschäftspartner-
--    Klassifikation. Bewusst getrennt (eine Wahrheit je Zweck) — s. Report.
-- =====================================================================

SET search_path TO wimus, public;

-- Trigger-Funktion (idempotent, identisch zu 014/017/018).
CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =====================================================================
-- 1. CUSTOM-FIELD-DEFINITION erweitern (vorhandene 002-Tabelle additiv)
-- =====================================================================
-- geschuetzt: System-Felder vor Lösch-/Umbenenn-/Key-Änderung schützen (API-Guard).
ALTER TABLE wimus.custom_field_definitionen
  ADD COLUMN IF NOT EXISTS geschuetzt BOOLEAN NOT NULL DEFAULT false;

-- bezug_typ um 'organisation' erweitern (CHECK additiv neu setzen).
ALTER TABLE wimus.custom_field_definitionen DROP CONSTRAINT IF EXISTS custom_field_definitionen_bezug_typ_check;
ALTER TABLE wimus.custom_field_definitionen
  ADD CONSTRAINT custom_field_definitionen_bezug_typ_check
  CHECK (bezug_typ IN ('objekt','einheit','kontakt','person','organisation','buchung','mietvertrag','vorgang'));

-- feldtyp um Spec-Typen 'mehrfachauswahl' + 'janein' erweitern (Bestand bleibt gültig).
ALTER TABLE wimus.custom_field_definitionen DROP CONSTRAINT IF EXISTS custom_field_definitionen_feldtyp_check;
ALTER TABLE wimus.custom_field_definitionen
  ADD CONSTRAINT custom_field_definitionen_feldtyp_check
  CHECK (feldtyp IN ('text','zahl','datum','bool','janein','url','email','auswahl','mehrfachauswahl','textarea'));

-- Stabiler key je (mandant, bezug_typ): feldschluessel ist der stabile Code-Key.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cfdef_key
  ON wimus.custom_field_definitionen (mandant_id, bezug_typ, feldschluessel)
  WHERE feldschluessel IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfdef_bezug ON wimus.custom_field_definitionen (mandant_id, bezug_typ, aktiv);

DROP TRIGGER IF EXISTS trg_cfdef_touch ON wimus.custom_field_definitionen;
CREATE TRIGGER trg_cfdef_touch BEFORE UPDATE ON wimus.custom_field_definitionen
  FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at();

-- =====================================================================
-- 2. CUSTOM-FIELD-OPTION (stabiler Options-key für auswahl/mehrfachauswahl)
-- =====================================================================
CREATE TABLE IF NOT EXISTS wimus.custom_field_option (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  def_id      UUID NOT NULL REFERENCES wimus.custom_field_definitionen(id) ON DELETE CASCADE,
  opt_key     TEXT NOT NULL,
  label       TEXT NOT NULL,
  sortierung  INT NOT NULL DEFAULT 0,
  aktiv       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cfopt_key ON wimus.custom_field_option (def_id, opt_key);
CREATE INDEX IF NOT EXISTS idx_cfopt_def ON wimus.custom_field_option (def_id, aktiv);

-- =====================================================================
-- 3. CUSTOM-FIELD-WERTE erweitern → Variante C (typisierte Wert-Spalten)
-- =====================================================================
-- Bestehende Tabelle (002): id, definition_id, bezug_typ, bezug_id, wert(text, legacy).
-- Additiv: mandant_id (direkte RLS/Tenant) + typisierte Spalten + Unique je Feld/Zeile.
ALTER TABLE wimus.custom_field_werte
  ADD COLUMN IF NOT EXISTS mandant_id UUID REFERENCES wimus.mandanten(id) ON DELETE CASCADE;
ALTER TABLE wimus.custom_field_werte ADD COLUMN IF NOT EXISTS wert_text  TEXT;
ALTER TABLE wimus.custom_field_werte ADD COLUMN IF NOT EXISTS wert_zahl  NUMERIC;
ALTER TABLE wimus.custom_field_werte ADD COLUMN IF NOT EXISTS wert_datum DATE;
ALTER TABLE wimus.custom_field_werte ADD COLUMN IF NOT EXISTS wert_bool  BOOLEAN;

-- Ein Wert je Feld je Zeile (Mehrfachauswahl-Optionen hängen separat, s. §4).
CREATE UNIQUE INDEX IF NOT EXISTS uq_cfwert_feld_zeile
  ON wimus.custom_field_werte (definition_id, bezug_typ, bezug_id);

-- Partielle B-Tree-Indizes je Typ-Spalte (schlank: nur belegte Werte).
CREATE INDEX IF NOT EXISTS idx_cfwert_text  ON wimus.custom_field_werte (bezug_typ, definition_id, wert_text)  WHERE wert_text  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfwert_zahl  ON wimus.custom_field_werte (bezug_typ, definition_id, wert_zahl)  WHERE wert_zahl  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfwert_datum ON wimus.custom_field_werte (bezug_typ, definition_id, wert_datum) WHERE wert_datum IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfwert_bool  ON wimus.custom_field_werte (bezug_typ, definition_id, wert_bool)  WHERE wert_bool  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfwert_zeile ON wimus.custom_field_werte (bezug_typ, bezug_id);

DROP TRIGGER IF EXISTS trg_cfwert_touch ON wimus.custom_field_werte;
CREATE TRIGGER trg_cfwert_touch BEFORE UPDATE ON wimus.custom_field_werte
  FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at();

-- =====================================================================
-- 4. CUSTOM-FIELD-VALUE-OPTION (nur Mehrfachauswahl: n Optionen je Wert)
-- =====================================================================
CREATE TABLE IF NOT EXISTS wimus.custom_field_value_option (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_id   UUID NOT NULL REFERENCES wimus.custom_field_werte(id) ON DELETE CASCADE,
  option_id  UUID NOT NULL REFERENCES wimus.custom_field_option(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cfvalopt ON wimus.custom_field_value_option (value_id, option_id);
CREATE INDEX IF NOT EXISTS idx_cfvalopt_option ON wimus.custom_field_value_option (option_id);

-- =====================================================================
-- 5. KONTAKT-TYPEN (Stammdaten, UI-pflegbar) + n:m-Zuordnung
-- =====================================================================
CREATE TABLE IF NOT EXISTS wimus.kontakt_typen (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id   UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  gilt_fuer    TEXT NOT NULL CHECK (gilt_fuer IN ('person','organisation')),
  typ_key      TEXT NOT NULL,                 -- stabiler key (Code/Filter matcht ihn, NIE Label)
  label        TEXT NOT NULL,
  geschuetzt   BOOLEAN NOT NULL DEFAULT false, -- System-Typ: nicht löschbar/umbenennbar (key fix)
  beschreibung TEXT,
  sortierung   INT NOT NULL DEFAULT 0,
  aktiv        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kontakt_typen_key ON wimus.kontakt_typen (mandant_id, gilt_fuer, typ_key);
CREATE INDEX IF NOT EXISTS idx_kontakt_typen_mandant ON wimus.kontakt_typen (mandant_id, gilt_fuer, aktiv);

CREATE TABLE IF NOT EXISTS wimus.kontakt_typ_zuordnung (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  typ_id     UUID NOT NULL REFERENCES wimus.kontakt_typen(id) ON DELETE CASCADE,
  ziel_typ   TEXT NOT NULL CHECK (ziel_typ IN ('person','organisation')),
  ziel_id    UUID NOT NULL,                   -- polymorph: kontakte.id (person) | organisationen.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kontakt_typ_zuordnung ON wimus.kontakt_typ_zuordnung (typ_id, ziel_typ, ziel_id);
CREATE INDEX IF NOT EXISTS idx_kontakt_typ_zuordnung_ziel ON wimus.kontakt_typ_zuordnung (ziel_typ, ziel_id);

-- =====================================================================
-- 6. PERSON ↔ ORGANISATION (n:m Ansprechpartner — additiv zur 1:n via
--    kontakte.organisation_id, die bestehen bleibt)
-- =====================================================================
CREATE TABLE IF NOT EXISTS wimus.person_organisation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id      UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  person_id       UUID NOT NULL REFERENCES wimus.kontakte(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES wimus.organisationen(id) ON DELETE CASCADE,
  funktion        TEXT,                        -- z.B. "Geschäftsführer", "Sachbearbeiter"
  ist_primaer     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_person_organisation ON wimus.person_organisation (person_id, organisation_id);
CREATE INDEX IF NOT EXISTS idx_person_org_org ON wimus.person_organisation (organisation_id);
CREATE INDEX IF NOT EXISTS idx_person_org_person ON wimus.person_organisation (person_id);

-- =====================================================================
-- 7. SEED System-Kontakttypen je Mandant (idempotent, geschuetzt)
--    Person-Typen spiegeln die ist_*-Flags; Organisation-Typen die organisationen.typ.
-- =====================================================================
INSERT INTO wimus.kontakt_typen (mandant_id, gilt_fuer, typ_key, label, geschuetzt, sortierung)
SELECT m.id, t.gilt_fuer, t.typ_key, t.label, true, t.sortierung
FROM wimus.mandanten m
CROSS JOIN (VALUES
  ('person','mieter','Mieter',10),
  ('person','eigentuemer','Eigentümer',20),
  ('person','dienstleister','Dienstleister',30),
  ('person','makler','Makler',40),
  ('person','tippgeber','Tippgeber',50),
  ('person','bank','Bank',60),
  ('organisation','eigentuemer','Eigentümer',10),
  ('organisation','makler','Makler',20),
  ('organisation','bautraeger','Bauträger',30),
  ('organisation','lieferant','Lieferant',40),
  ('organisation','investor','Investor',50)
) AS t(gilt_fuer, typ_key, label, sortierung)
ON CONFLICT (mandant_id, gilt_fuer, typ_key) DO NOTHING;

-- =====================================================================
-- 8. Trigger + RLS (mandant_isolation) + Grants für alle neuen Tabellen
-- =====================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'custom_field_option','kontakt_typen','person_organisation'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON wimus.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON wimus.%1$s
                      FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at()', t);
  END LOOP;
END $$;

-- 8a. Tabellen mit eigener mandant_id-Spalte → direkte mandant_isolation.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'custom_field_werte','kontakt_typen','kontakt_typ_zuordnung','person_organisation'
  ] LOOP
    EXECUTE format('ALTER TABLE wimus.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS mandant_isolation ON wimus.%I', t);
    EXECUTE format($f$
      CREATE POLICY mandant_isolation ON wimus.%I
        FOR ALL TO authenticated
        USING (mandant_id IN (SELECT wimus.user_mandanten()))
        WITH CHECK (mandant_id IN (SELECT wimus.user_mandanten()))
    $f$, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.%I TO authenticated', t);
  END LOOP;
END $$;

-- 8b. Options-Tabellen erben den Mandanten über die Definition (kein eigenes mandant_id).
ALTER TABLE wimus.custom_field_option ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.custom_field_option;
CREATE POLICY mandant_isolation ON wimus.custom_field_option
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wimus.custom_field_definitionen d
                 WHERE d.id = custom_field_option.def_id
                   AND d.mandant_id IN (SELECT wimus.user_mandanten())))
  WITH CHECK (EXISTS (SELECT 1 FROM wimus.custom_field_definitionen d
                 WHERE d.id = custom_field_option.def_id
                   AND d.mandant_id IN (SELECT wimus.user_mandanten())));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.custom_field_option TO authenticated;

ALTER TABLE wimus.custom_field_value_option ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.custom_field_value_option;
CREATE POLICY mandant_isolation ON wimus.custom_field_value_option
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wimus.custom_field_werte w
                 WHERE w.id = custom_field_value_option.value_id
                   AND w.mandant_id IN (SELECT wimus.user_mandanten())))
  WITH CHECK (EXISTS (SELECT 1 FROM wimus.custom_field_werte w
                 WHERE w.id = custom_field_value_option.value_id
                   AND w.mandant_id IN (SELECT wimus.user_mandanten())));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.custom_field_value_option TO authenticated;

-- =====================================================================
-- Kontrolle:
--   SELECT to_regclass('wimus.kontakt_typen'), to_regclass('wimus.person_organisation'),
--          to_regclass('wimus.custom_field_option'), to_regclass('wimus.custom_field_value_option');
--   SELECT gilt_fuer, count(*) FROM wimus.kontakt_typen WHERE geschuetzt GROUP BY 1;
--   SELECT column_name FROM information_schema.columns
--     WHERE table_schema='wimus' AND table_name='custom_field_werte' ORDER BY ordinal_position;
-- =====================================================================
