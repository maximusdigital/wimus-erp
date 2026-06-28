-- =====================================================================
-- Migration 026: Kommunikations-Schicht (Modul 007) – E-Mail + WhatsApp
--
-- Additiv + idempotent. Anwenden: SQL-Editor.
--
-- Eine Nachrichten-Wahrheit, viele Kanäle (Channel-Adapter-Pattern). Kontakt-
-- zentriert: jede Nachricht hängt an mindestens einem Kontakt (jeder Typ —
-- Rolle via kontakte.ist_*-Flags). Immobilienbezug (Einheit/Objekt) optional,
-- über kom_nachricht_bezug (n:m) abgeleitet. Secrets NUR verschlüsselt
-- (lib/kommunikation/crypto.ts, Schlüssel aus Server-Env), write-only in der UI.
--
-- Verifiziert gegen reales wimus-Schema:
--   kontakte (Rolle = ist_mieter/ist_eigentuemer/ist_makler/… Booleans), email,
--   telefon_mobil; vorgaenge, einheiten, objekte vorhanden. Bestehende
--   wimus.nachrichten ist zu dünn (kein extern_id/Anhang/Postfach/Konversation)
--   → kom_* neu, Legacy unberührt. Trigger wimus.touch_updated_at() existiert (023).
-- =====================================================================

SET search_path TO wimus, public;

-- ---------------------------------------------------------------------
-- 1. E-Mail-Postfächer (IMAP/SMTP je Marke/Zweck)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_postfaecher (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id              UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  marke                   TEXT,                       -- freie Markenkennung (ALFA CAMPUS …)
  bezeichnung             TEXT NOT NULL,
  zweck                   TEXT NOT NULL DEFAULT 'kontakt' CHECK (zweck IN ('kontakt','support','belege')),
  imap_host               TEXT,
  imap_port               INTEGER DEFAULT 993,
  imap_secure             BOOLEAN NOT NULL DEFAULT true,
  smtp_host               TEXT,
  smtp_port               INTEGER DEFAULT 465,
  smtp_secure             BOOLEAN NOT NULL DEFAULT true,
  benutzer                TEXT,                       -- Login / From-Adresse
  passwort_verschluesselt TEXT,                       -- NIE Klartext, write-only in UI
  oauth_config_verschluesselt TEXT,                   -- optional (OAuth2 statt PW)
  aktiv                   BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kom_postfaecher_mandant ON wimus.kom_postfaecher(mandant_id);

-- ---------------------------------------------------------------------
-- 2. WhatsApp/GreenAPI-Instanzen
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_wa_instanzen (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id                  UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  marke                       TEXT,
  bezeichnung                 TEXT NOT NULL,
  green_id_instance           TEXT,
  green_api_token_verschluesselt TEXT,                -- write-only
  green_api_host              TEXT DEFAULT 'https://api.green-api.com',
  telefon                     TEXT,
  status                      TEXT NOT NULL DEFAULT 'notAuthorized'
                                CHECK (status IN ('authorized','notAuthorized','blocked','starting','unbekannt')),
  webhook_token               TEXT,                   -- Pfad-/Header-Token zur Webhook-Validierung
  aktiv                       BOOLEAN NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kom_wa_instanzen_mandant ON wimus.kom_wa_instanzen(mandant_id);

-- ---------------------------------------------------------------------
-- 3. Konversationen (Thread/Chat-Gruppierung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_konversationen (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id          UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  kanal               TEXT NOT NULL CHECK (kanal IN ('email','whatsapp')),
  kontakt_id          UUID REFERENCES wimus.kontakte(id) ON DELETE SET NULL,
  vorgang_id          UUID REFERENCES wimus.vorgaenge(id) ON DELETE SET NULL,
  betreff             TEXT,
  letzter_nachricht_am TIMESTAMPTZ,
  ungelesen_anzahl    INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kom_konversationen_mandant ON wimus.kom_konversationen(mandant_id);
CREATE INDEX IF NOT EXISTS idx_kom_konversationen_kontakt ON wimus.kom_konversationen(kontakt_id);

-- ---------------------------------------------------------------------
-- 4. Nachrichten (gemeinsame Wahrheit)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_nachrichten (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id      UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  kanal           TEXT NOT NULL CHECK (kanal IN ('email','whatsapp')),
  richtung        TEXT NOT NULL CHECK (richtung IN ('eingehend','ausgehend')),
  postfach_id     UUID REFERENCES wimus.kom_postfaecher(id) ON DELETE SET NULL,
  wa_instanz_id   UUID REFERENCES wimus.kom_wa_instanzen(id) ON DELETE SET NULL,
  konversation_id UUID REFERENCES wimus.kom_konversationen(id) ON DELETE SET NULL,
  extern_id       TEXT,                               -- Message-ID / GreenAPI idMessage
  von_adresse     TEXT,
  an_adresse      TEXT,
  betreff         TEXT,
  text            TEXT,
  hat_anhaenge    BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'empfangen'
                    CHECK (status IN ('empfangen','gesendet','zugestellt','gelesen','fehler','warteschlange')),
  fehler_text     TEXT,                               -- bei status=fehler (Retry-Queue-Diagnose; nie Secrets)
  ist_autoreply   BOOLEAN NOT NULL DEFAULT false,     -- Anti-Schleife: Autoreply nie auf Autoreply
  kontakt_id      UUID REFERENCES wimus.kontakte(id) ON DELETE SET NULL,
  vorgang_id      UUID REFERENCES wimus.vorgaenge(id) ON DELETE SET NULL,
  gesendet_am     TIMESTAMPTZ,
  empfangen_am    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Dublettenschutz: gleiche extern_id je Kanal nur einmal (NULL erlaubt mehrfach).
CREATE UNIQUE INDEX IF NOT EXISTS ux_kom_nachrichten_extern
  ON wimus.kom_nachrichten (kanal, extern_id) WHERE extern_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_konv
  ON wimus.kom_nachrichten (konversation_id, empfangen_am);
CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_kontakt
  ON wimus.kom_nachrichten (kontakt_id);
CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_mandant
  ON wimus.kom_nachrichten (mandant_id);
-- Trigram für Modul 0006 (Suche) – nur falls pg_trgm vorhanden (024 legt es an).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_text_trgm
      ON wimus.kom_nachrichten USING gin (text gin_trgm_ops);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. Anhänge
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_anhaenge (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id   UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  nachricht_id UUID NOT NULL REFERENCES wimus.kom_nachrichten(id) ON DELETE CASCADE,
  dateiname    TEXT,
  mime_typ     TEXT,
  groesse      BIGINT,
  speicher_ref TEXT,                                  -- Key/Pfad in vorhandener Medien-Ablage
  ocr_status   TEXT CHECK (ocr_status IN ('offen','laeuft','fertig','fehler','nicht_relevant')),
  beleg_id     UUID,                                  -- Verknüpfung zum FiBu-Beleg nach OCR (verarbeiteBeleg)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kom_anhaenge_nachricht ON wimus.kom_anhaenge(nachricht_id);

-- ---------------------------------------------------------------------
-- 6. Bezug (n:m – zentral UND dezentral). Basis = Kontakt, immer gesetzt.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_nachricht_bezug (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id   UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  nachricht_id UUID NOT NULL REFERENCES wimus.kom_nachrichten(id) ON DELETE CASCADE,
  bezug_typ    TEXT NOT NULL CHECK (bezug_typ IN ('kontakt','mieter','einheit','objekt','vorgang','wg')),
  bezug_id     UUID NOT NULL,                         -- FK polymorph (kontakte/einheiten/objekte/vorgaenge)
  quelle       TEXT NOT NULL DEFAULT 'adressiert' CHECK (quelle IN ('adressiert','abgeleitet')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_kom_bezug
  ON wimus.kom_nachricht_bezug (nachricht_id, bezug_typ, bezug_id);
CREATE INDEX IF NOT EXISTS idx_kom_bezug_ziel
  ON wimus.kom_nachricht_bezug (bezug_typ, bezug_id, quelle);

-- ---------------------------------------------------------------------
-- 7. Signaturen (genau eines von postfach_id/wa_instanz_id gesetzt)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_signaturen (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id    UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  postfach_id   UUID REFERENCES wimus.kom_postfaecher(id) ON DELETE CASCADE,
  wa_instanz_id UUID REFERENCES wimus.kom_wa_instanzen(id) ON DELETE CASCADE,
  typ           TEXT NOT NULL CHECK (typ IN ('email','whatsapp')),
  inhalt        TEXT NOT NULL,                        -- HTML/Text mit Platzhaltern {absender}/{marke}/…
  aktiv         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(postfach_id, wa_instanz_id) = 1)
);
CREATE INDEX IF NOT EXISTS idx_kom_signaturen_postfach ON wimus.kom_signaturen(postfach_id);
CREATE INDEX IF NOT EXISTS idx_kom_signaturen_wa ON wimus.kom_signaturen(wa_instanz_id);

-- ---------------------------------------------------------------------
-- 8. Autoreply-Regeln (Stufe 1, statisch; Upgrade-Pfad 0005)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.kom_autoreply_regeln (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id    UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  postfach_id   UUID REFERENCES wimus.kom_postfaecher(id) ON DELETE CASCADE,
  wa_instanz_id UUID REFERENCES wimus.kom_wa_instanzen(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  aktiv         BOOLEAN NOT NULL DEFAULT true,
  bedingung_typ TEXT NOT NULL DEFAULT 'immer'
                  CHECK (bedingung_typ IN ('immer','ausser_geschaeftszeiten','stichwort')),
  bedingung_wert JSONB,                               -- Stichwörter / Zeitfenster
  antwort_text  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(postfach_id, wa_instanz_id) = 1)
);
CREATE INDEX IF NOT EXISTS idx_kom_autoreply_postfach ON wimus.kom_autoreply_regeln(postfach_id);
CREATE INDEX IF NOT EXISTS idx_kom_autoreply_wa ON wimus.kom_autoreply_regeln(wa_instanz_id);

-- ---------------------------------------------------------------------
-- 9. updated_at-Trigger
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'kom_postfaecher','kom_wa_instanzen','kom_konversationen',
    'kom_signaturen','kom_autoreply_regeln'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_touch ON wimus.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_touch BEFORE UPDATE ON wimus.%I FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at()',
      t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 10. RLS mandant_isolation auf allen kom_*-Tabellen
-- ---------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'kom_postfaecher','kom_wa_instanzen','kom_konversationen','kom_nachrichten',
    'kom_anhaenge','kom_nachricht_bezug','kom_signaturen','kom_autoreply_regeln'
  ]) LOOP
    EXECUTE format('ALTER TABLE wimus.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS mandant_isolation ON wimus.%I', t);
    EXECUTE format(
      'CREATE POLICY mandant_isolation ON wimus.%I FOR ALL TO authenticated '
      'USING (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid())) '
      'WITH CHECK (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))',
      t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.%I TO authenticated', t);
  END LOOP;
END $$;

-- Kontrolle: SELECT tablename FROM pg_tables WHERE schemaname='wimus' AND tablename LIKE 'kom_%';
