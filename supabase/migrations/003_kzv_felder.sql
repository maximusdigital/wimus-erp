-- =====================================================================
-- Migration 003 – KZV-Felder (Phase 3)
-- Additiv auf dem bestehenden public-Schema (Migration 001).
-- Anwendung über Supabase SQL-Editor (DB-Port bleibt geschlossen).
--
-- Ergänzt die für die Kurzzeitvermietung (KZV) nötigen Felder gem. Spec v5:
--   - einheiten: statischer Keybox-PIN (Hauszugang) + Standort + max. Personen
--   - buchungen_kzv: zwei PIN-Codes (apartment_pin dynamisch ≠ keybox_pin statisch),
--     USt-Satz (7%), Gästemappe-Token, Meldeschein-Reisepass (DSGVO-Löschkonzept!)
-- Bestehende Spalten (nuki_code, tuya_szene, city_tax) bleiben unberührt.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Einheiten: Keybox (statischer Hauszugang) + KZV-Kapazität
-- ---------------------------------------------------------------------
alter table public.einheiten
  add column if not exists keybox_pin_statisch text,   -- Hauszugang, STATISCH (≠ Apartment-PIN)
  add column if not exists keybox_standort     text,   -- z.B. "links neben Eingangstür"
  add column if not exists max_personen        integer;

comment on column public.einheiten.keybox_pin_statisch is
  'Statischer Keybox-PIN für den Hauszugang. Wird je Buchung nach buchungen_kzv.keybox_pin kopiert. NICHT der dynamische Apartment-PIN.';

-- ---------------------------------------------------------------------
-- 2) Buchungen (KZV): zwei PINs, USt, Gästemappe, Meldeschein
-- ---------------------------------------------------------------------
alter table public.buchungen_kzv
  add column if not exists apartment_pin        text,                      -- TTLock/Nuki, DYNAMISCH je Buchung
  add column if not exists keybox_pin           text,                      -- STATISCH, aus einheiten.keybox_pin_statisch
  add column if not exists ust_prozent          numeric(5,2) not null default 7.00,
  add column if not exists gaestemappe_token    uuid not null default gen_random_uuid(),
  add column if not exists meldeschein_reisepass text;                     -- DSGVO: Löschkonzept beachten!

comment on column public.buchungen_kzv.apartment_pin is
  'Dynamischer Apartment-PIN (TTLock/Nuki), je Buchung neu generiert. ≠ keybox_pin.';
comment on column public.buchungen_kzv.keybox_pin is
  'Statischer Keybox-PIN (Hauszugang), kopiert aus einheiten.keybox_pin_statisch.';
comment on column public.buchungen_kzv.meldeschein_reisepass is
  'DSGVO-sensibel (Beherbergungspflicht). Unterliegt dem Löschkonzept.';

-- Schneller Lookup der Gästemappe per Token (öffentliche URL gast.../{TOKEN}).
create unique index if not exists buchungen_kzv_gaestemappe_token_idx
  on public.buchungen_kzv (gaestemappe_token);
