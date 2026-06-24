-- =====================================================================
-- Migration 006: wimus für die App nutzbar machen
--   (1) GRANTs für anon/authenticated/service_role auf Schema wimus
--   (2) RLS-Read-Policies für Org-Tabellen (workspaces/firmen/projekte)
--   (3) Seed Firmen + Projekte gem. Spezifikation V501/V502 Kap. 2 + 4.1
-- Idempotent – mehrfaches Ausführen ist gefahrlos.
-- Anwenden: Supabase SQL-Editor (DB-Port ist extern zu).
-- =====================================================================

SET search_path TO wimus, public;

-- ---------------------------------------------------------------------
-- (1) GRANTs – Supabase legt sie für Custom-Schemas NICHT automatisch an.
--     Zugriff wird wie bei public über RLS geregelt; die GRANTs öffnen nur
--     die Tür, RLS-Policies entscheiden über die Zeilen.
-- ---------------------------------------------------------------------
GRANT USAGE ON SCHEMA wimus TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA wimus TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA wimus TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA wimus TO anon, authenticated, service_role;

-- Für künftig neu angelegte Tabellen/Sequenzen automatisch mitgranten.
ALTER DEFAULT PRIVILEGES IN SCHEMA wimus
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA wimus
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ---------------------------------------------------------------------
-- (2) RLS-Read-Policies für die Org-Hierarchie.
--     Org-Struktur (Workspace/Firma/Projekt) ist keine mandantengebundene
--     Tenant-Tabelle → für angemeldete Nutzer (und den Preview-/anon-Modus)
--     lesbar. Schreibrechte laufen über die App/Service-Role.
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['workspaces','firmen','projekte'] LOOP
    EXECUTE format('ALTER TABLE wimus.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS p_org_read ON wimus.%I', t);
    EXECUTE format(
      'CREATE POLICY p_org_read ON wimus.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- (3) Seed – feste UUIDs, ON CONFLICT (id) DO NOTHING → idempotent.
--     Workspace „WIMUS Gruppe" existiert bereits (Seed aus Vor-Migration).
-- ---------------------------------------------------------------------
DO $$
DECLARE
  ws_id uuid;
BEGIN
  SELECT id INTO ws_id FROM wimus.workspaces ORDER BY created_at NULLS FIRST LIMIT 1;
  IF ws_id IS NULL THEN
    ws_id := '19277469-7ba2-41ac-bf3d-cca1d94a6d31';
    INSERT INTO wimus.workspaces (id, kuerzel, name, inhaber, aktiv)
    VALUES (ws_id, 'WG', 'WIMUS Gruppe', 'Dipl.-Kfm. Maxim Moser', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Firmen (Spec 4.1: 3 Gesellschaften)
  INSERT INTO wimus.firmen (id, workspace_id, name, kuerzel, rechtsform, aktiv) VALUES
    ('a0000000-0000-4000-8000-000000000001', ws_id, 'Maxim Moser (privat)', 'MMP', 'Einzelunternehmen', true),
    ('a0000000-0000-4000-8000-000000000002', ws_id, 'WIMUS GmbH',           'WIM', 'GmbH', true),
    ('a0000000-0000-4000-8000-000000000003', ws_id, 'WIMUS vvGmbH',         'VVG', 'GmbH', true)
  ON CONFLICT (id) DO NOTHING;

  -- Top-Level-Projekte (ebene 0). firma: KZV/Bestand → vvGmbH, operativ/Bau → WIMUS GmbH.
  INSERT INTO wimus.projekte (id, workspace_id, firma_id, parent_projekt_id, ebene, kuerzel, name, typ, status, aktiv) VALUES
    ('b0000000-0000-4000-8000-000000000001', ws_id, 'a0000000-0000-4000-8000-000000000003', NULL, 0, 'AAP', 'ALFA APARTMENTS',       'kzv',            'aktiv', true),
    ('b0000000-0000-4000-8000-000000000002', ws_id, 'a0000000-0000-4000-8000-000000000003', NULL, 0, 'ACA', 'ALFA CAMPUS',           'wg',             'aktiv', true),
    ('b0000000-0000-4000-8000-000000000003', ws_id, 'a0000000-0000-4000-8000-000000000002', NULL, 0, 'WHV', 'WIMUS Hausverwaltung',  'hausverwaltung', 'aktiv', true),
    ('b0000000-0000-4000-8000-000000000004', ws_id, 'a0000000-0000-4000-8000-000000000002', NULL, 0, 'MFHSO', 'MFH Stuttgart-Ost',   'bauprojekt',     'aktiv', true),
    ('b0000000-0000-4000-8000-000000000005', ws_id, 'a0000000-0000-4000-8000-000000000001', NULL, 0, 'ABHS21A', 'Ankauf BHS21A',     'ankauf',         'aktiv', true)
  ON CONFLICT (id) DO NOTHING;

  -- Unterprojekte von ALFA APARTMENTS (ebene 1) – Spec 2.3/2.5
  INSERT INTO wimus.projekte (id, workspace_id, firma_id, parent_projekt_id, ebene, kuerzel, name, typ, status, aktiv) VALUES
    ('b0000000-0000-4000-8000-000000000011', ws_id, 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 1, 'AAP-TOUR', 'Touristen / KZV', 'kzv',     'aktiv', true),
    ('b0000000-0000-4000-8000-000000000012', ws_id, 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 1, 'AAP-MONT', 'Monteure',        'monteur', 'aktiv', true)
  ON CONFLICT (id) DO NOTHING;
END $$;
