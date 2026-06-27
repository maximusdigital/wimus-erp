-- =====================================================================
-- Migration 018: Modul 004 (ops) – Vorgangs-Engine + Begleiter + Typ-Erweiterungen
--
-- Setzt 002 (vorgaenge), 005 (fristen/forderungen), 017 (akteure) voraus.
-- Schärft die bestehende wimus.vorgaenge (additiv) und legt die Engine-Begleit-
-- tabellen + 5 Typ-Erweiterungen an. Idempotent. Anwenden: SQL-Editor.
--
-- Architektur: EINE Engine, Typen = 1:1-Zusatz (vorgang_id PK/FK).
-- =====================================================================

SET search_path TO wimus, public;

CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- 1. vorgaenge schärfen (additiv)
-- ---------------------------------------------------------------------
ALTER TABLE wimus.vorgaenge ADD COLUMN IF NOT EXISTS owner_akteur_id UUID
  REFERENCES wimus.akteure(id) ON DELETE SET NULL;
ALTER TABLE wimus.vorgaenge ADD COLUMN IF NOT EXISTS faellig_am TIMESTAMPTZ;
ALTER TABLE wimus.vorgaenge ADD COLUMN IF NOT EXISTS eskaliert BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE wimus.vorgaenge ADD COLUMN IF NOT EXISTS eskaliert_am TIMESTAMPTZ;
ALTER TABLE wimus.vorgaenge ADD COLUMN IF NOT EXISTS benachrichtigung_kanal TEXT;

-- Legacy-Status normalisieren, bevor CHECK greift.
UPDATE wimus.vorgaenge SET status = 'wartet_extern' WHERE status = 'wartet';

-- CHECKs additiv (DROP+ADD = idempotent), als NOT VALID: greifen für neue/geänderte
-- Zeilen, prüfen aber bestehende Altdaten nicht (vermeidet Fehler bei Legacy-Werten).
ALTER TABLE wimus.vorgaenge DROP CONSTRAINT IF EXISTS chk_vorgaenge_status;
ALTER TABLE wimus.vorgaenge ADD CONSTRAINT chk_vorgaenge_status CHECK (status IN
  ('offen','zugewiesen','in_arbeit','wartet_extern','erledigt','abgenommen','abgebrochen')) NOT VALID;
ALTER TABLE wimus.vorgaenge DROP CONSTRAINT IF EXISTS chk_vorgaenge_typ;
ALTER TABLE wimus.vorgaenge ADD CONSTRAINT chk_vorgaenge_typ CHECK (typ IS NULL OR typ IN
  ('schaden','reparatur','reinigung','uebergabe','wartung','anfrage','kuendigung','sonstiges')) NOT VALID;

-- ---------------------------------------------------------------------
-- 2. Engine-Begleiter
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.vorgang_verlauf (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  vorgang_id  UUID NOT NULL REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  akteur_id   UUID,
  art         TEXT NOT NULL CHECK (art IN ('status','zuweisung','feld','notiz','eskalation','benachrichtigung')),
  von_status  TEXT,
  nach_status TEXT,
  feld        TEXT,
  alt_wert    TEXT,
  neu_wert    TEXT,
  notiz       TEXT,
  am          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vorgang_verlauf_vorgang ON wimus.vorgang_verlauf(vorgang_id);

CREATE TABLE IF NOT EXISTS wimus.vorgang_zuweisung (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id           UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  vorgang_id           UUID NOT NULL REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  akteur_id            UUID REFERENCES wimus.akteure(id) ON DELETE SET NULL,
  organisation_id      UUID REFERENCES wimus.organisationen(id) ON DELETE SET NULL,
  kontakt_id           UUID REFERENCES wimus.kontakte(id) ON DELETE SET NULL,
  rolle                TEXT NOT NULL DEFAULT 'ausfuehrend' CHECK (rolle IN ('verantwortlich','ausfuehrend','extern')),
  status               TEXT NOT NULL DEFAULT 'vorgeschlagen' CHECK (status IN
                         ('vorgeschlagen','beauftragt','angenommen','abgelehnt','erledigt')),
  auftrag_versendet_am TIMESTAMPTZ,
  auftrag_kanal        TEXT,
  grund                TEXT CHECK (grund IS NULL OR grund IN ('primaer','vertretung','kapazitaet','manuell','ki')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vorgang_zuweisung_vorgang ON wimus.vorgang_zuweisung(vorgang_id);

CREATE TABLE IF NOT EXISTS wimus.vorgang_foto (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id    UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  vorgang_id    UUID NOT NULL REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  phase         TEXT NOT NULL DEFAULT 'sonstig' CHECK (phase IN ('vorher','nachher','befund','sonstig')),
  paperless_id  TEXT,
  url           TEXT,
  beschreibung  TEXT,
  akteur_id     UUID,
  aufgenommen_am TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vorgang_foto_vorgang ON wimus.vorgang_foto(vorgang_id);

-- ---------------------------------------------------------------------
-- 3. Typ-Erweiterungen (1:1, vorgang_id PK)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.vorgang_reinigung (
  vorgang_id       UUID PRIMARY KEY REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  mandant_id       UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  buchung_id       UUID REFERENCES wimus.buchungen(id) ON DELETE SET NULL,
  turnaround       BOOLEAN NOT NULL DEFAULT false,
  inventar_ok      BOOLEAN,
  naechster_checkin TIMESTAMPTZ,
  dauer_soll_min   INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wimus.vorgang_uebergabe (
  vorgang_id           UUID PRIMARY KEY REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  mandant_id           UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  richtung             TEXT NOT NULL DEFAULT 'auszug' CHECK (richtung IN ('einzug','auszug')),
  mietvertrag_id       UUID REFERENCES wimus.mietvertraege(id) ON DELETE SET NULL,
  zaehlerstaende       JSONB NOT NULL DEFAULT '{}'::jsonb,
  schluessel           JSONB NOT NULL DEFAULT '{}'::jsonb,
  signatur_paperless_id TEXT,
  abgleich_vorgang_id  UUID REFERENCES wimus.vorgaenge(id) ON DELETE SET NULL,
  kaution_relevant     BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wimus.vorgang_wartung (
  vorgang_id              UUID PRIMARY KEY REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  mandant_id              UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  frist_id                UUID REFERENCES wimus.fristen(id) ON DELETE SET NULL,
  intervall_typ           TEXT,
  pruefprotokoll_paperless_id TEXT,
  naechste_faelligkeit    DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wimus.vorgang_reparatur (
  vorgang_id          UUID PRIMARY KEY REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  mandant_id          UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  angebot_betrag      NUMERIC(12,2),
  angebot_paperless_id TEXT,
  abgenommen          BOOLEAN NOT NULL DEFAULT false,
  abgenommen_am       TIMESTAMPTZ,
  gewaehrleistung_bis DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wimus.vorgang_schaden (
  vorgang_id        UUID PRIMARY KEY REFERENCES wimus.vorgaenge(id) ON DELETE CASCADE,
  mandant_id        UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  schaden_typ       TEXT CHECK (schaden_typ IS NULL OR schaden_typ IN
                      ('boden','wand','sanitaer','elektro','moebel','fenster','sonstiges')),
  schwere           TEXT CHECK (schwere IS NULL OR schwere IN ('bagatell','mittel','gross','grossschaden')),
  schaden_betrag    NUMERIC(12,2),
  abwicklungsstufe  TEXT CHECK (abwicklungsstufe IS NULL OR abwicklungsstufe IN
                      ('kaution','plattform','manuell','mahnbescheid','anwalt')),
  versicherungsfall BOOLEAN NOT NULL DEFAULT false,
  versicherung_id   UUID REFERENCES wimus.versicherungen(id) ON DELETE SET NULL,
  forderung_id      UUID REFERENCES wimus.forderungen(id) ON DELETE SET NULL,
  festgestellt_am   DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checklisten-Ausführung um Akteur ergänzen (Tabelle aus Migration 002).
ALTER TABLE wimus.checklisten_ausfuehrungen ADD COLUMN IF NOT EXISTS akteur_id UUID
  REFERENCES wimus.akteure(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 4. Trigger + RLS + Grants für alle neuen Tabellen
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vorgang_verlauf','vorgang_zuweisung','vorgang_foto',
                           'vorgang_reinigung','vorgang_uebergabe','vorgang_wartung',
                           'vorgang_reparatur','vorgang_schaden'] LOOP
    -- vorgang_verlauf/_foto haben kein updated_at → kein Touch-Trigger.
    IF t NOT IN ('vorgang_verlauf','vorgang_foto') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON wimus.%1$s', t);
      EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON wimus.%1$s
                        FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at()', t);
    END IF;
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
--   AND tablename LIKE 'vorgang_%';
