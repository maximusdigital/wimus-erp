-- =====================================================================
-- WIMUS ERP – Seed-Daten (Phase 0)
-- Datei: supabase/seed.sql
--
-- Enthält:
--   * 4 aktive Mandanten (Marken)
--   * 9 Bestandsobjekte (Status IST) aus CLAUDE.md
--
-- Idempotent: mehrfaches Ausführen erzeugt keine Duplikate
-- (ON CONFLICT über die Unique-Constraints kuerzel bzw. (mandant_id, kuerzel)).
--
-- Hinweis Mandanten-Zuordnung der Objekte (Annahme – bei Bedarf anpassen):
--   * R2R-KZV-Objekte (BS18A1, BS5A2) -> ALFA APARTMENTS
--   * Zimmer-/WG-Objekt mit 14 Zimmern (BHS16) -> ALFA CAMPUS
--   * übrige Bestandsobjekte (EW/MFH/EFH) -> WIMUS Hausverwaltung
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Mandanten
-- ---------------------------------------------------------------------
insert into public.mandanten (id, name, kuerzel, rechtsform, farbe, aktiv) values
  ('11111111-1111-1111-1111-111111111111', 'WIMUS Hausverwaltung', 'WIMUS', 'GmbH', '#1e3a8a', true),
  ('22222222-2222-2222-2222-222222222222', 'ALFA CAMPUS',          'CAMPUS','GmbH', '#0d9488', true),
  ('33333333-3333-3333-3333-333333333333', 'ALFA APARTMENTS',      'APART', 'GmbH', '#b45309', true),
  ('44444444-4444-4444-4444-444444444444', 'ALFA DEVELOPMENT',     'DEV',   'GmbH', '#9333ea', true)
on conflict (kuerzel) do nothing;

-- ---------------------------------------------------------------------
-- 2. Bestandsobjekte (Status IST)
-- ---------------------------------------------------------------------
insert into public.objekte
  (mandant_id, kuerzel, bezeichnung, strasse, hausnummer, ort, objekttyp, haltestrategie, status)
values
  -- WIMUS Hausverwaltung – Bestand
  ((select id from public.mandanten where kuerzel = 'WIMUS'),
   'IS17',  'Ihmlingstr. 17 – EW',           'Ihmlingstraße',     '17',   'Stuttgart-Bad Cannstatt', 'EW',  'bestand', 'ist'),
  ((select id from public.mandanten where kuerzel = 'WIMUS'),
   'LS17',  'Ihmlingstr. 17 – EW',           'Ihmlingstraße',     '17',   'Stuttgart',               'EW',  'bestand', 'ist'),
  ((select id from public.mandanten where kuerzel = 'WIMUS'),
   'AS125', 'Austraße 125 – MFH 4WE+2G',     'Austraße',          '125',  'Stuttgart-Münster',       'MFH', 'bestand', 'ist'),
  ((select id from public.mandanten where kuerzel = 'WIMUS'),
   'MS13',  'Murrstr. 13 – MFH 3WE+GA',      'Murrstraße',        '13',   'Kornwestheim',            'MFH', 'bestand', 'ist'),
  ((select id from public.mandanten where kuerzel = 'WIMUS'),
   'SG10',  'Spreuergasse 10 – MFH 3WE',     'Spreuergasse',      '10',   'Stuttgart-Bad Cannstatt', 'MFH', 'bestand', 'ist'),
  ((select id from public.mandanten where kuerzel = 'WIMUS'),
   'BS21A', 'Bietigheimer Str. 21A – EFH',   'Bietigheimer Straße','21A', 'Stuttgart-Zuffenhausen',  'EFH', 'bestand', 'ist'),

  -- ALFA CAMPUS – Zimmer/WG (14 Zimmer)
  ((select id from public.mandanten where kuerzel = 'CAMPUS'),
   'BHS16', 'Bauhofstr. 16 – MFH 4WE 14Z',   'Bauhofstraße',      '16',   'Ludwigsburg',             'MFH', 'bestand', 'ist'),

  -- ALFA APARTMENTS – R2R KZV
  ((select id from public.mandanten where kuerzel = 'APART'),
   'BS18A1','Beilsteiner Str. 18A – R2R KZV','Beilsteiner Straße','18A',  'Stuttgart',               'R2R-KZV', 'r2r', 'ist'),
  ((select id from public.mandanten where kuerzel = 'APART'),
   'BS5A2', 'Beilsteiner Str. 5A2 – R2R KZV','Beilsteiner Straße','5A',   'Kornwestheim',            'R2R-KZV', 'r2r', 'ist')
on conflict (mandant_id, kuerzel) do nothing;

-- ---------------------------------------------------------------------
-- 3. (Optional) User -> Mandant verknüpfen
--     RLS blockt alle Daten, bis der eingeloggte User in user_mandanten steht.
--     UUID des Users aus auth.users einsetzen und ausführen:
-- ---------------------------------------------------------------------
-- insert into public.user_mandanten (user_id, mandant_id, rolle)
-- select 'DEINE-USER-UUID'::uuid, id, 'admin' from public.mandanten
-- on conflict (user_id, mandant_id) do nothing;
