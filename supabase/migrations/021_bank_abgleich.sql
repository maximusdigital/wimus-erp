-- =====================================================================
-- Migration 021: Bank-Abgleich (FiBu 0002) – Kontoumsätze + Match → forderungen
--
-- Additiv + idempotent. Anwenden: SQL-Editor.
--
-- WISO/KSK-CSV-Import → bank_umsaetze; mehrstufiger Match (K1/Name/Betrag) ordnet
-- Einnahmen offenen forderungen (typ=miete) zu. KEIN neues OP-Modell (forderungen
-- bleiben die Sollstellung). Namens-Abgrenzung: wimus.buchungen=KZV,
-- fibu_buchungen=FiBu, bank_umsaetze=Kontoauszug (eindeutig).
-- =====================================================================

SET search_path TO wimus, public;

CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------------------------------------------------------------------
-- 1. Bankkonten
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.bank_konten (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id   UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  bezeichnung  TEXT NOT NULL,
  iban         TEXT,
  bank         TEXT,
  aktiv        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_konten_mandant ON wimus.bank_konten(mandant_id);

-- ---------------------------------------------------------------------
-- 2. Kontoumsätze (importierte Zeilen + Match-Ergebnis)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.bank_umsaetze (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id              UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  bank_konto_id           UUID REFERENCES wimus.bank_konten(id) ON DELETE SET NULL,
  -- Rohdaten aus dem Export
  wertstellung            DATE NOT NULL,
  empfaenger              TEXT,
  verwendungszweck        TEXT,
  kategorie_wiso          TEXT,                      -- informativ (WISO-Kategorie)
  betrag                  NUMERIC(12,2) NOT NULL,    -- Vorzeichen: − = Ausgabe
  saldo                   NUMERIC(14,2),             -- Kontostand laut Export
  richtung                TEXT NOT NULL CHECK (richtung IN ('einnahme','ausgabe')),
  -- Dublettenschutz (mandant+konto+datum+betrag+zweck)
  import_hash             TEXT NOT NULL UNIQUE,
  import_am               TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Match-Ergebnis
  erkanntes_k1            TEXT,
  objekt_id               UUID REFERENCES wimus.objekte(id) ON DELETE SET NULL,
  einheit_id              UUID REFERENCES wimus.einheiten(id) ON DELETE SET NULL,
  mietvertrag_id          UUID REFERENCES wimus.mietvertraege(id) ON DELETE SET NULL,
  match_methode           TEXT CHECK (match_methode IS NULL OR match_methode IN
                            ('k1','name','betrag','manuell')),
  match_confidence        NUMERIC(3,2),
  zuordnung_status        TEXT NOT NULL DEFAULT 'offen' CHECK (zuordnung_status IN
                            ('offen','zugeordnet','teilweise','manuell','ignoriert')),
  forderung_id            UUID REFERENCES wimus.forderungen(id) ON DELETE SET NULL,
  zugeordnet_am           TIMESTAMPTZ,
  zugeordnet_von_akteur_id UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_umsaetze_mandant   ON wimus.bank_umsaetze(mandant_id);
CREATE INDEX IF NOT EXISTS idx_bank_umsaetze_status    ON wimus.bank_umsaetze(zuordnung_status);
CREATE INDEX IF NOT EXISTS idx_bank_umsaetze_vertrag   ON wimus.bank_umsaetze(mietvertrag_id);
CREATE INDEX IF NOT EXISTS idx_bank_umsaetze_wertstellung ON wimus.bank_umsaetze(wertstellung);

-- ---------------------------------------------------------------------
-- 3. Trigger + RLS + Grants
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bank_konten','bank_umsaetze'] LOOP
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
--   AND tablename LIKE 'bank_%';
