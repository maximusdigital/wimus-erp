-- =====================================================================
-- Migration 028: Modul 009 (historie) – Audit-Log (DB-Trigger, Whitelist)
--                + Aktivitäts-Historie (aktivitaeten + aktivitaet_bezug)
--
-- Spec: 009_historie_000/200/300. Additiv + idempotent. Einspielen: /pg/query.
--
-- REALITÄT (gegen wimus-Schema verifiziert, s. Report):
--  * Whitelist-Tabellen existieren alle mit id + mandant_id.
--  * Akteur: SET LOCAL wimus.akteur_id ist über supabase-js/PostgREST NICHT setzbar
--    (HTTP, keine persistente Session). Daher liest der Trigger ZUSÄTZLICH die von
--    PostgREST je Request gesetzte GUC request.jwt.claims (->>'sub' = auth-User-UUID).
--    Reihenfolge: explizite wimus.akteur_id → JWT sub → NULL (=direkt).
--  * audit_log ist append-only: authenticated bekommt nur SELECT; geschrieben wird
--    ausschließlich vom SECURITY-DEFINER-Trigger (Owner umgeht RLS).
-- =====================================================================

SET search_path TO wimus, public;

-- ---------------------------------------------------------------------
-- 1. Hilfsfunktion: geänderte Spalten (UPDATE) als text[]
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION wimus.changed_keys(p_old jsonb, p_new jsonb)
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(array_agg(key ORDER BY key), '{}')
  FROM jsonb_object_keys(p_new) AS key
  WHERE p_new -> key IS DISTINCT FROM p_old -> key;
$$;

-- ---------------------------------------------------------------------
-- 2. audit_log (append-only)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.audit_log (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mandant_id       UUID,
  tabelle          TEXT NOT NULL,
  operation        TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  datensatz_id     UUID,
  alt              JSONB,
  neu              JSONB,
  geaendert_felder TEXT[],
  akteur_id        UUID,                       -- auth-User / Akteur-UUID (keine harte FK: auth.users ≠ wimus.akteure)
  akteur_quelle    TEXT NOT NULL DEFAULT 'direkt' CHECK (akteur_quelle IN ('app','system','direkt')),
  zeitpunkt        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_datensatz ON wimus.audit_log (tabelle, datensatz_id, zeitpunkt DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_mandant   ON wimus.audit_log (mandant_id, zeitpunkt DESC);

-- ---------------------------------------------------------------------
-- 3. Generischer Audit-Trigger (SECURITY DEFINER, robust gegen Logging-Fehler)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION wimus.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_akteur uuid;
  v_claims text;
  v_quelle text;
BEGIN
  BEGIN
    -- Akteur: 1) explizite Session-Var, 2) PostgREST-JWT (sub), sonst NULL = direkt
    v_akteur := nullif(current_setting('wimus.akteur_id', true), '')::uuid;
    IF v_akteur IS NULL THEN
      v_claims := current_setting('request.jwt.claims', true);
      IF v_claims IS NOT NULL AND v_claims <> '' THEN
        v_akteur := nullif(v_claims::jsonb ->> 'sub', '')::uuid;
      END IF;
    END IF;
    v_quelle := CASE WHEN v_akteur IS NULL THEN 'direkt' ELSE 'app' END;

    INSERT INTO wimus.audit_log(mandant_id, tabelle, operation, datensatz_id, alt, neu,
      geaendert_felder, akteur_id, akteur_quelle)
    VALUES (
      coalesce(NEW.mandant_id, OLD.mandant_id),
      TG_TABLE_NAME, TG_OP,
      coalesce(NEW.id, OLD.id),
      CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
      CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN to_jsonb(NEW) END,
      CASE WHEN TG_OP = 'UPDATE' THEN wimus.changed_keys(to_jsonb(OLD), to_jsonb(NEW)) END,
      v_akteur, v_quelle
    );
  EXCEPTION WHEN OTHERS THEN
    -- Logging darf die eigentliche DB-Operation NIE abbrechen
    RAISE WARNING 'audit_trigger % on % failed: %', TG_OP, TG_TABLE_NAME, SQLERRM;
  END;
  RETURN coalesce(NEW, OLD);
END; $$;

-- ---------------------------------------------------------------------
-- 4. Trigger auf Whitelist anbringen (idempotent, real verifiziert)
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'mietvertraege','kontakte','organisationen','forderungen','mahnungen',
    'buchungen','belege','bank_umsaetze','belegung_sperren','fibu_buchungen'
  ] LOOP
    IF to_regclass('wimus.'||t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON wimus.%1$s', t);
      EXECUTE format('CREATE TRIGGER trg_audit_%1$s AFTER INSERT OR UPDATE OR DELETE
                        ON wimus.%1$s FOR EACH ROW EXECUTE FUNCTION wimus.audit_trigger()', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 5. Aktivitäts-Historie
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wimus.aktivitaeten (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id   UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  typ          TEXT NOT NULL,                 -- zahlung_eingegangen, mahnung_versandt, vertrag_angelegt …
  modul        TEXT NOT NULL,                 -- fibu|kommunikation|belegung|vertrag|zugang|…
  titel        TEXT NOT NULL,
  beschreibung TEXT,
  akteur_id    UUID,                          -- wer löste aus (auth-User/System)
  audit_log_id BIGINT REFERENCES wimus.audit_log(id) ON DELETE SET NULL,
  payload      JSONB,
  zeitpunkt    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aktivitaeten_feed   ON wimus.aktivitaeten (mandant_id, zeitpunkt DESC);
CREATE INDEX IF NOT EXISTS idx_aktivitaeten_filter ON wimus.aktivitaeten (modul, typ);

CREATE TABLE IF NOT EXISTS wimus.aktivitaet_bezug (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aktivitaet_id UUID NOT NULL REFERENCES wimus.aktivitaeten(id) ON DELETE CASCADE,
  bezug_typ    TEXT NOT NULL CHECK (bezug_typ IN ('kontakt','mieter','einheit','objekt','vorgang','organisation','mietvertrag','buchung')),
  bezug_id     UUID NOT NULL,
  quelle       TEXT NOT NULL DEFAULT 'primaer' CHECK (quelle IN ('primaer','abgeleitet')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_aktivitaet_bezug ON wimus.aktivitaet_bezug (aktivitaet_id, bezug_typ, bezug_id);
CREATE INDEX IF NOT EXISTS idx_aktivitaet_bezug_ziel ON wimus.aktivitaet_bezug (bezug_typ, bezug_id);

-- ---------------------------------------------------------------------
-- 6. RLS + Grants
-- ---------------------------------------------------------------------
-- audit_log: nur SELECT (append-only); mandant-isoliert. Rollen-Gating app-seitig.
ALTER TABLE wimus.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.audit_log;
CREATE POLICY mandant_isolation ON wimus.audit_log
  FOR SELECT TO authenticated
  USING (mandant_id IN (SELECT wimus.user_mandanten()));
REVOKE ALL ON wimus.audit_log FROM authenticated;
GRANT SELECT ON wimus.audit_log TO authenticated;

-- aktivitaeten / aktivitaet_bezug: voll mandant-isoliert (protokolliere schreibt).
ALTER TABLE wimus.aktivitaeten ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.aktivitaeten;
CREATE POLICY mandant_isolation ON wimus.aktivitaeten
  FOR ALL TO authenticated
  USING (mandant_id IN (SELECT wimus.user_mandanten()))
  WITH CHECK (mandant_id IN (SELECT wimus.user_mandanten()));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.aktivitaeten TO authenticated;

ALTER TABLE wimus.aktivitaet_bezug ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.aktivitaet_bezug;
CREATE POLICY mandant_isolation ON wimus.aktivitaet_bezug
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wimus.aktivitaeten a
                 WHERE a.id = aktivitaet_bezug.aktivitaet_id
                   AND a.mandant_id IN (SELECT wimus.user_mandanten())))
  WITH CHECK (EXISTS (SELECT 1 FROM wimus.aktivitaeten a
                 WHERE a.id = aktivitaet_bezug.aktivitaet_id
                   AND a.mandant_id IN (SELECT wimus.user_mandanten())));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.aktivitaet_bezug TO authenticated;

-- ---------------------------------------------------------------------
-- Kontrolle:
--   SELECT to_regclass('wimus.audit_log'), to_regclass('wimus.aktivitaeten'),
--          to_regclass('wimus.aktivitaet_bezug');
--   SELECT tgrelid::regclass AS tabelle FROM pg_trigger
--     WHERE tgname LIKE 'trg_audit_%' AND NOT tgisinternal ORDER BY 1;
-- =====================================================================
