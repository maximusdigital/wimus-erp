-- =====================================================================
-- Migration 007: Daten-Cutover public -> wimus  (Kern-Bestandsdaten)
--
-- Stand der echten public-Daten (2026-06-25):
--   mandanten = 4 Zeilen, objekte = 10 Zeilen,
--   gesellschaften / einheiten / kontakte / vertraege = LEER (0).
-- → Nur mandanten + objekte enthalten Daten; alles andere migriert 0 Zeilen.
--
-- ⚠️ REVIEW + ZUERST AUF BACKUP/STAGING ausführen. Cross-Schema-Copy,
--    idempotent (ON CONFLICT (id) DO NOTHING). IDs bleiben erhalten → FKs gültig.
--
-- ⚠️ Mögliche CHECK/ENUM-Mismatches (vor Prod prüfen):
--    - objekte.typ: public-Werte EW/MFH/EFH/R2R-KZV/Gewerbe/Sonstiges
--      müssen zum wimus-CHECK auf objekte.typ passen.
--    - objekte.status: public ist/akquise/verkauft vs. wimus-CHECK.
--    Falls Mismatch → unten ein CASE-Mapping ergänzen.
--
-- ⚠️ Nicht übernommene public-Spalten (kein Ziel in wimus):
--    mandanten.briefkopf_url
--    objekte.bezeichnung, objekte.wohnflaeche_qm,
--    objekte.grundstuecksflaeche_qm, objekte.notiz
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) mandanten  (4 Zeilen)
--    farbe -> ci_farbe_primary, datev_mandant -> datev_mandant_nr
-- ---------------------------------------------------------------------
INSERT INTO wimus.mandanten
  (id, kuerzel, name, rechtsform, iban, datev_mandant_nr, ci_farbe_primary,
   aktiv, created_at, updated_at)
SELECT
  id, kuerzel, name, rechtsform, iban, datev_mandant, farbe,
  aktiv, created_at, updated_at
FROM public.mandanten
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) objekte  (10 Zeilen) – mandanten müssen vorher da sein (FK)
--    ort -> stadt, objekttyp -> typ
-- ---------------------------------------------------------------------
INSERT INTO wimus.objekte
  (id, mandant_id, gesellschaft_id, kuerzel, strasse, hausnummer, plz, stadt,
   typ, baujahr, status, haltestrategie, nutzen_lasten_datum, notartermin_datum,
   marktwert_sprengnetter, marktwert_pricehubble, created_at, updated_at)
SELECT
  id, mandant_id, gesellschaft_id, kuerzel, strasse, hausnummer, plz, ort,
  objekttyp, baujahr, status, haltestrategie, nutzen_lasten_datum, notartermin_datum,
  marktwert_sprengnetter, marktwert_pricehubble, created_at, updated_at
FROM public.objekte
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3) Leere Tabellen – aktuell 0 Zeilen, daher kein Copy nötig.
--    Sobald hier public-Daten existieren, sind Transformationen nötig:
--      gesellschaften: drop rechtsform/handelsregister/sitz; + kuerzel/typ
--      einheiten:     einheitstyp->typ, wohnflaeche_qm->flaeche,
--                     zimmer_anzahl->zimmer, mandant_id entfällt (über objekt)
--      kontakte:      typ -> ist_mieter/ist_eigentuemer/... (Feld-Split),
--                     firma->firmenname, telefon->telefon_festnetz, ort->stadt
--      vertraege:     Ziel ist wimus.mietvertraege (Rename):
--                     beginn->mietbeginn, ende->mietende, vertragsart->vertragstyp
--    → Diese Mappings werden ergänzt, falls/wenn Daten anfallen.
-- ---------------------------------------------------------------------

-- Kontrolle nach dem Lauf:
--   SELECT (SELECT count(*) FROM wimus.mandanten) AS mandanten,
--          (SELECT count(*) FROM wimus.objekte)   AS objekte;
