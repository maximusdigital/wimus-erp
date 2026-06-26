-- =====================================================================
-- Migration 013: CRM-Pipelines (Spec 0003) – Leads & Deals, Kanban
--
-- Setzt 0001-Kern (firmen/kontakte/objekte/einheiten/mandanten) und 012
-- (organisationen) voraus.
--
-- NAMENSKONVENTION: Tabellen mit Prefix crm_, weil Migration 002 bereits
-- ungenutzte v5-Stubs wimus.deals / wimus.pipelines / wimus.pipeline_phasen /
-- wimus.custom_field_definitionen / wimus.interessenten enthält (anderes,
-- altes Modell, kein Code nutzt sie). Analog zu fibu_buchungen ≠ buchungen (KZV)
-- vermeidet das Prefix Kollision/Clobbering ohne destruktiven DROP.
--
-- AKTEURE: owner_akteur_id / akteur_id als bare UUID ohne FK (wie fibu_buchungen
-- .akteur_id) – Akteure-Modell wird nicht hart referenziert.
-- ZEITSTEMPEL: created_at/updated_at (Kern-Konvention) statt erstellt_am/
-- geaendert_am der Grobspec – konsistent mit Touch-Trigger.
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT). SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- ---------------------------------------------------------------------
-- 1. crm_pipelines
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_pipelines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id       UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  beschreibung     TEXT,
  marke            TEXT NOT NULL DEFAULT 'uebergreifend' CHECK (marke IN
                     ('hausverwaltung','alfa_apartments','alfa_campus','alfa_development','uebergreifend')),
  aktiv            BOOLEAN NOT NULL DEFAULT true,
  sortierung       INT NOT NULL DEFAULT 100,
  default_pipeline BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_mandant ON wimus.crm_pipelines(mandant_id);
-- Nur eine Default-Pipeline je Marke je Mandant (partielles UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_pipelines_default_marke
  ON wimus.crm_pipelines(mandant_id, marke) WHERE default_pipeline;

-- ---------------------------------------------------------------------
-- 2. crm_pipeline_stages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_pipeline_stages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id        UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  pipeline_id       UUID NOT NULL REFERENCES wimus.crm_pipelines(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  sortierung        INT NOT NULL DEFAULT 0,
  wahrscheinlichkeit NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (wahrscheinlichkeit >= 0 AND wahrscheinlichkeit <= 100),
  ist_gewonnen      BOOLEAN NOT NULL DEFAULT false,
  ist_verloren      BOOLEAN NOT NULL DEFAULT false,
  stalled_tage      INT,
  farbe             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, sortierung)
);
CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON wimus.crm_pipeline_stages(pipeline_id);

-- ---------------------------------------------------------------------
-- 3. crm_verloren_gruende (Stammdaten)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_verloren_gruende (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id  UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  bezeichnung TEXT NOT NULL,
  sortierung  INT NOT NULL DEFAULT 100,
  aktiv       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 4. crm_custom_field_definitionen (UI-konfigurierbar, je deal/lead)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_custom_field_definitionen (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id         UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  entitaet           TEXT NOT NULL CHECK (entitaet IN ('deal','lead')),
  name               TEXT NOT NULL,
  feldtyp            TEXT NOT NULL CHECK (feldtyp IN
                       ('text','zahl','betrag','datum','einzeloption','mehrfachoption','adresse','boolean')),
  optionen           JSONB NOT NULL DEFAULT '[]'::jsonb,
  anzeige_hinzufuegen BOOLEAN NOT NULL DEFAULT true,
  anzeige_detail     BOOLEAN NOT NULL DEFAULT true,
  pflicht            BOOLEAN NOT NULL DEFAULT false,
  wichtig            BOOLEAN NOT NULL DEFAULT false,
  pipeline_id        UUID REFERENCES wimus.crm_pipelines(id) ON DELETE CASCADE,
  sortierung         INT NOT NULL DEFAULT 100,
  aktiv              BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_cfd_entitaet ON wimus.crm_custom_field_definitionen(entitaet);

-- ---------------------------------------------------------------------
-- 5. crm_deals
--   firma_id  = Mandant/Buchungskreis (INNEN, Pflicht)
--   organisation_id = externe Firma (AUSSEN)
--   einheit_immobilie_id = Wohn-/Gewerbeeinheit (≠ Mandant)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_deals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id           UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id             UUID NOT NULL REFERENCES wimus.firmen(id) ON DELETE RESTRICT,
  pipeline_id          UUID NOT NULL REFERENCES wimus.crm_pipelines(id) ON DELETE RESTRICT,
  stage_id             UUID NOT NULL REFERENCES wimus.crm_pipeline_stages(id) ON DELETE RESTRICT,
  titel                TEXT NOT NULL,
  kontakt_id           UUID REFERENCES wimus.kontakte(id) ON DELETE SET NULL,
  organisation_id      UUID REFERENCES wimus.organisationen(id) ON DELETE SET NULL,
  objekt_id            UUID REFERENCES wimus.objekte(id) ON DELETE SET NULL,
  einheit_immobilie_id UUID REFERENCES wimus.einheiten(id) ON DELETE SET NULL,
  wert                 NUMERIC(14,2),
  waehrung             TEXT NOT NULL DEFAULT 'EUR',
  erwartetes_abschluss_datum DATE,
  status               TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','gewonnen','verloren')),
  verloren_grund_id    UUID REFERENCES wimus.crm_verloren_gruende(id) ON DELETE SET NULL,
  owner_akteur_id      UUID,
  custom_values        JSONB NOT NULL DEFAULT '{}'::jsonb,
  in_stage_seit        TIMESTAMPTZ NOT NULL DEFAULT now(),
  abgeschlossen_am     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON wimus.crm_deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON wimus.crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_firma ON wimus.crm_deals(firma_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON wimus.crm_deals(status);

-- ---------------------------------------------------------------------
-- 6. crm_deal_stage_historie (Tage-in-Stage, Durchlaufzeit, Audit)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_deal_stage_historie (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id        UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  deal_id           UUID NOT NULL REFERENCES wimus.crm_deals(id) ON DELETE CASCADE,
  von_stage_id      UUID REFERENCES wimus.crm_pipeline_stages(id) ON DELETE SET NULL,
  nach_stage_id     UUID NOT NULL REFERENCES wimus.crm_pipeline_stages(id) ON DELETE CASCADE,
  akteur_id         UUID,
  am                TIMESTAMPTZ NOT NULL DEFAULT now(),
  verweildauer_tage INT
);
CREATE INDEX IF NOT EXISTS idx_crm_histo_deal ON wimus.crm_deal_stage_historie(deal_id);

-- ---------------------------------------------------------------------
-- 7. crm_deal_aktivitaeten
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_deal_aktivitaeten (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id    UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  deal_id       UUID NOT NULL REFERENCES wimus.crm_deals(id) ON DELETE CASCADE,
  typ           TEXT NOT NULL DEFAULT 'aufgabe' CHECK (typ IN
                  ('anruf','email','meeting','aufgabe','frist','notiz')),
  titel         TEXT NOT NULL,
  beschreibung  TEXT,
  faellig_am    TIMESTAMPTZ,
  erledigt      BOOLEAN NOT NULL DEFAULT false,
  erledigt_am   TIMESTAMPTZ,
  akteur_id     UUID,
  sip_referenz  TEXT,
  nachricht_id  UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_akt_deal ON wimus.crm_deal_aktivitaeten(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_akt_faellig ON wimus.crm_deal_aktivitaeten(faellig_am) WHERE NOT erledigt;

-- ---------------------------------------------------------------------
-- 8. crm_leads (schlanke Inbox, kein Kanban)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.crm_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id          UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id            UUID REFERENCES wimus.firmen(id) ON DELETE SET NULL,
  quelle              TEXT NOT NULL DEFAULT 'manuell' CHECK (quelle IN
                        ('manuell','web_formular','whatsapp','telefon','portal','email','sonstige')),
  kontakt_id          UUID REFERENCES wimus.kontakte(id) ON DELETE SET NULL,
  organisation_id     UUID REFERENCES wimus.organisationen(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  kontaktdaten        TEXT,
  anfrage_text        TEXT,
  objekt_bezug_id     UUID REFERENCES wimus.objekte(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'neu' CHECK (status IN
                        ('neu','qualifiziert','konvertiert','verworfen')),
  verworfen_grund     TEXT,
  labels              TEXT[] NOT NULL DEFAULT '{}',
  custom_values       JSONB NOT NULL DEFAULT '{}'::jsonb,
  zugeordnet_akteur_id UUID,
  deal_id             UUID REFERENCES wimus.crm_deals(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON wimus.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_mandant ON wimus.crm_leads(mandant_id);

-- ---------------------------------------------------------------------
-- Trigger (updated_at) + RLS (mandant_isolation) + Grants
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_pipelines','crm_pipeline_stages','crm_verloren_gruende',
                           'crm_custom_field_definitionen','crm_deals','crm_leads'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON wimus.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON wimus.%1$s
                      FOR EACH ROW EXECUTE FUNCTION wimus.crm_touch_updated_at()', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['crm_pipelines','crm_pipeline_stages','crm_verloren_gruende',
                           'crm_custom_field_definitionen','crm_deals',
                           'crm_deal_stage_historie','crm_deal_aktivitaeten','crm_leads'] LOOP
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

-- ---------------------------------------------------------------------
-- Seed: je Mandant ohne Pipeline eine Default-Akquise-Pipeline + Stages
-- + Standard-Verloren-Gründe (idempotent über NOT EXISTS-Guards).
-- ---------------------------------------------------------------------
DO $$
DECLARE m RECORD; pid UUID;
BEGIN
  FOR m IN SELECT id FROM wimus.mandanten LOOP
    -- Default-Pipeline nur, wenn der Mandant noch gar keine hat.
    IF NOT EXISTS (SELECT 1 FROM wimus.crm_pipelines WHERE mandant_id = m.id) THEN
      INSERT INTO wimus.crm_pipelines (mandant_id, name, beschreibung, marke, sortierung, default_pipeline)
        VALUES (m.id, 'Akquise', 'Standard-Vertriebspipeline', 'uebergreifend', 10, true)
        RETURNING id INTO pid;
      INSERT INTO wimus.crm_pipeline_stages
        (mandant_id, pipeline_id, name, sortierung, wahrscheinlichkeit, ist_gewonnen, ist_verloren, stalled_tage, farbe) VALUES
        (m.id, pid, 'Neu',         0, 10,  false, false, 14, 'secondary'),
        (m.id, pid, 'Kontaktiert', 1, 25,  false, false, 14, 'secondary'),
        (m.id, pid, 'Qualifiziert',2, 50,  false, false, 21, 'teal'),
        (m.id, pid, 'Angebot',     3, 75,  false, false, 30, 'warning'),
        (m.id, pid, 'Gewonnen',    4, 100, true,  false, NULL, 'success'),
        (m.id, pid, 'Verloren',    5, 0,   false, true,  NULL, 'danger');
    END IF;

    -- Standard-Verloren-Gründe (nur wenn noch keine vorhanden).
    IF NOT EXISTS (SELECT 1 FROM wimus.crm_verloren_gruende WHERE mandant_id = m.id) THEN
      INSERT INTO wimus.crm_verloren_gruende (mandant_id, bezeichnung, sortierung) VALUES
        (m.id, 'Kein Bedarf',          10),
        (m.id, 'Preis zu hoch',        20),
        (m.id, 'An Wettbewerber',      30),
        (m.id, 'Kein Budget',          40),
        (m.id, 'Nicht erreichbar',     50),
        (m.id, 'Unrealistisch / Spam', 60);
    END IF;
  END LOOP;
END $$;

-- Kontrolle: SELECT tablename FROM pg_tables WHERE schemaname='wimus' AND tablename LIKE 'crm_%';
