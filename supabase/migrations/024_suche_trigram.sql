-- =====================================================================
-- Migration 024: Such-/Filter-Schicht (Modul 006) – pg_trgm + GIN-Indizes
--
-- Additiv + idempotent. Anwenden: SQL-Editor.
--
-- Trigram-Indizes (gin_trgm_ops) beschleunigen fuzzy/Teilstring-Suche (ILIKE '%q%',
-- similarity) auf den durchsuchbaren Spalten der verifizierten Entitäten. KEINE
-- Daten-Duplikation — Indizes auf den echten Tabellen. FTS (such_vektor) bewusst
-- nicht in Stufe 1 (kein großes Freitextfeld auf den Kern-Entitäten; Roadmap).
-- =====================================================================

SET search_path TO wimus, public;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- kontakte (Mieter/Personen/Firmen)
CREATE INDEX IF NOT EXISTS idx_kontakte_nachname_trgm   ON wimus.kontakte   USING gin (nachname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakte_vorname_trgm    ON wimus.kontakte   USING gin (vorname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakte_firmenname_trgm ON wimus.kontakte   USING gin (firmenname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakte_email_trgm      ON wimus.kontakte   USING gin (email gin_trgm_ops);

-- objekte
CREATE INDEX IF NOT EXISTS idx_objekte_kuerzel_trgm     ON wimus.objekte    USING gin (kuerzel gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_objekte_strasse_trgm     ON wimus.objekte    USING gin (strasse gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_objekte_stadt_trgm       ON wimus.objekte    USING gin (stadt gin_trgm_ops);

-- einheiten
CREATE INDEX IF NOT EXISTS idx_einheiten_kuerzel_trgm   ON wimus.einheiten  USING gin (kuerzel gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_einheiten_bez_trgm       ON wimus.einheiten  USING gin (bezeichnung gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_einheiten_vzc_trgm       ON wimus.einheiten  USING gin (verwendungszweck_code gin_trgm_ops);

-- mietvertraege / vorgaenge / buchungen (Aktenzeichen)
CREATE INDEX IF NOT EXISTS idx_mietvertraege_az_trgm    ON wimus.mietvertraege USING gin (aktenzeichen gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vorgaenge_az_trgm        ON wimus.vorgaenge  USING gin (aktenzeichen gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_buchungen_az_trgm        ON wimus.buchungen  USING gin (aktenzeichen gin_trgm_ops);

-- Kontrolle: SELECT indexname FROM pg_indexes WHERE schemaname='wimus' AND indexname LIKE '%_trgm';
