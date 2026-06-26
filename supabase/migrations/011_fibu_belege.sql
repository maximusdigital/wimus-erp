-- =====================================================================
-- Migration 011: FiBu (Spec 0002) – Belege / Buchungssätze / Korrekturen
-- (Grobplan Schritt 3). Setzt 010 (Stammdaten) voraus.
--
-- WICHTIG: wimus.buchungen existiert bereits (KZV-Reservierungen aus dem
-- Kern-Schema). Die FiBu-Buchungssätze heißen daher fibu_buchungen /
-- fibu_korrekturen – die KZV-Tabelle bleibt unangetastet.
--
-- Buchungskreis = firmen (wie 010). belege.hash UNIQUE = DB-seitige
-- Dublettensicherung; fibu_buchungen.buchungs_id_extern stabil (TaxPool-Dedup).
-- ocr_verarbeitung_id bleibt referenzlos (ocr_verarbeitungen separat).
--
-- Idempotent. Anwenden: Supabase SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- ---------------------------------------------------------------------
-- belege (GoBD-versioniert)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.belege (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id          UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id            UUID REFERENCES wimus.firmen(id) ON DELETE SET NULL,
  ocr_verarbeitung_id UUID,
  hash                TEXT UNIQUE,
  original_ref        TEXT,
  kanal               TEXT CHECK (kanal IS NULL OR kanal IN ('email','gdrive','upload','whatsapp')),
  ist_erechnung       BOOLEAN NOT NULL DEFAULT false,
  klasse              TEXT,
  belegnummer         TEXT,
  belegdatum          DATE,
  faelligkeitsdatum   DATE,
  lieferant_id        UUID REFERENCES wimus.lieferanten(id) ON DELETE SET NULL,
  lieferant_name      TEXT,
  lieferant_ustid     TEXT,
  iban                TEXT,
  gewerk              TEXT,
  netto               NUMERIC(12,2),
  brutto              NUMERIC(12,2),
  ust_satz            NUMERIC(5,2),
  ust_betrag          NUMERIC(12,2),
  soll_konto          TEXT,
  steuerschluessel    TEXT,
  k1                  TEXT,
  k2                  TEXT,
  positionen          JSONB,
  confidence_ocr        NUMERIC(3,2),
  confidence_extraktion NUMERIC(3,2),
  confidence_kontierung NUMERIC(3,2),
  review_flag         BOOLEAN NOT NULL DEFAULT true,
  review_gruende      TEXT[] DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'eingegangen'
                        CHECK (status IN ('eingegangen','einheit_zugeordnet','ocr_ok',
                          'extrahiert','validiert','freigabe_offen','gebucht',
                          'exportiert','fehler','dublette','abgelehnt')),
  version             INT NOT NULL DEFAULT 1,
  vorgaenger_beleg_id UUID REFERENCES wimus.belege(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_belege_status ON wimus.belege(status);
CREATE INDEX IF NOT EXISTS idx_belege_firma ON wimus.belege(firma_id);
CREATE INDEX IF NOT EXISTS idx_belege_datum ON wimus.belege(belegdatum);

-- ---------------------------------------------------------------------
-- fibu_buchungen (Eingangs-Buchungssätze – NICHT die KZV-buchungen!)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.fibu_buchungen (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id         UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  firma_id           UUID REFERENCES wimus.firmen(id) ON DELETE SET NULL,
  beleg_id           UUID REFERENCES wimus.belege(id) ON DELETE CASCADE,
  datum              DATE,
  soll_konto         TEXT,
  haben_konto        TEXT,
  betrag_brutto      NUMERIC(12,2),
  ust_schluessel     TEXT,
  k1                 TEXT,
  k2                 TEXT,
  buchungstext       TEXT,
  buchungs_id_extern TEXT UNIQUE,
  akteur_id          UUID,
  akteur_typ         TEXT CHECK (akteur_typ IS NULL OR akteur_typ IN ('mensch','ki')),
  gebucht_am         TIMESTAMPTZ,
  exportiert_am      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fibu_buchungen_beleg ON wimus.fibu_buchungen(beleg_id);
CREATE INDEX IF NOT EXISTS idx_fibu_buchungen_firma ON wimus.fibu_buchungen(firma_id);

-- ---------------------------------------------------------------------
-- fibu_korrekturen (lernender Loop)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.fibu_korrekturen (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  buchung_id UUID REFERENCES wimus.fibu_buchungen(id) ON DELETE CASCADE,
  beleg_id   UUID REFERENCES wimus.belege(id) ON DELETE CASCADE,
  feld       TEXT NOT NULL,
  alt_wert   TEXT,
  neu_wert   TEXT,
  akteur_id  UUID,
  am         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fibu_korrekturen_beleg ON wimus.fibu_korrekturen(beleg_id);

-- ---------------------------------------------------------------------
-- updated_at-Trigger (fibu_touch_updated_at aus 010) + RLS
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['belege','fibu_buchungen','fibu_korrekturen'] LOOP
    IF t <> 'fibu_korrekturen' THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON wimus.%1$s', t);
      EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON wimus.%1$s
                        FOR EACH ROW EXECUTE FUNCTION wimus.fibu_touch_updated_at()', t);
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
--   AND tablename IN ('belege','fibu_buchungen','fibu_korrekturen');
