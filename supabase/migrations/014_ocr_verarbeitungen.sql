-- =====================================================================
-- Migration 014: Kern (Spec 0001) – ocr_verarbeitungen
--
-- Gemeinsame OCR-Basis (Mistral): Volltext + strukturierte Felder + Confidence
-- je verarbeitetem Dokument. FiBu (0002) referenziert sie über
-- belege.ocr_verarbeitung_id (bewusst REFERENZLOS belassen, Spec 0002/200) –
-- daher hier KEIN Rück-FK auf belege.
--
-- Quelle: 001_erp_200_datenmodell.md (§ocr_verarbeitungen). ENUM-Felder als TEXT
-- (offene Wertelisten in der Spec). geprueft_von = bare UUID (Akteure-Modell,
-- wie fibu_buchungen.akteur_id).
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS). Anwenden: SQL-Editor.
-- =====================================================================

SET search_path TO wimus, public;

-- Generischer Touch-Trigger (wird auch von 015/016 genutzt).
CREATE OR REPLACE FUNCTION wimus.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS wimus.ocr_verarbeitungen (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id         UUID NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE,
  paperless_id       VARCHAR(100),
  dokument_typ       TEXT,
  ocr_raw_md         TEXT,
  ocr_structured     JSONB,
  ocr_confidence     NUMERIC(3,2),
  ocr_seiten         INT,
  ki_modell          VARCHAR(50),
  felder_extrahiert  JSONB,
  felder_unsicher    JSONB,
  felder_kritisch    JSONB,
  ziel_tabelle       VARCHAR(50),
  ziel_id            UUID,
  status             TEXT NOT NULL DEFAULT 'ocr_fertig'
                       CHECK (status IN ('ocr_fertig','extrahiert','geprueft','verworfen','fehler')),
  geprueft_von       UUID,
  paperless_md_id    VARCHAR(100),
  paperless_json_id  VARCHAR(100),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ocr_verarbeitungen_mandant ON wimus.ocr_verarbeitungen(mandant_id);
CREATE INDEX IF NOT EXISTS idx_ocr_verarbeitungen_status ON wimus.ocr_verarbeitungen(status);
CREATE INDEX IF NOT EXISTS idx_ocr_verarbeitungen_ziel ON wimus.ocr_verarbeitungen(ziel_tabelle, ziel_id);

DROP TRIGGER IF EXISTS trg_ocr_verarbeitungen_touch ON wimus.ocr_verarbeitungen;
CREATE TRIGGER trg_ocr_verarbeitungen_touch BEFORE UPDATE ON wimus.ocr_verarbeitungen
  FOR EACH ROW EXECUTE FUNCTION wimus.touch_updated_at();

ALTER TABLE wimus.ocr_verarbeitungen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mandant_isolation ON wimus.ocr_verarbeitungen;
CREATE POLICY mandant_isolation ON wimus.ocr_verarbeitungen
  FOR ALL TO authenticated
  USING (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()))
  WITH CHECK (mandant_id IN (SELECT mandant_id FROM public.user_mandanten WHERE user_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON wimus.ocr_verarbeitungen TO authenticated;

-- Kontrolle: SELECT to_regclass('wimus.ocr_verarbeitungen');
