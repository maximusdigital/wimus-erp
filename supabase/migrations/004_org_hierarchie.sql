-- =====================================================================
-- Migration 004: Org-Hierarchie (Workspace → Firma → Projekt)
--
-- ⚠️ TRACKING-MIGRATION — zeichnet den LIVE-Ist-Zustand nach.
--    Die Tabellen workspaces/firmen/projekte laufen bereits produktiv
--    (V501-Fundament, von Migration 006 befüllt, app-seitig genutzt),
--    waren aber NICHT als Migration getrackt → „fehlende Migration 004".
--    Diese Migration ist auf der Live-DB ein NO-OP (alles `if not exists`),
--    baut aber auf einer frischen DB die Struktur korrekt auf.
--
--    Reihenfolge: nach 003 (kzv_felder), vor 005 (bk/fristen). workspaces/
--    firmen/projekte sind FK-Ziel vieler späterer Tabellen (belege, fibu_*,
--    citytax_saetze, pipelines, vorlagen, akteure, …) → muss früh stehen.
--
--    Quelle: Live-DDL-Extraktion 2026-06-29 (.docs/_NOTE_org-hierarchie-live-ddl.md,
--    Report 20260629_1535). Spalten/Constraints/Indizes/RLS/Trigger 1:1 aus dem
--    laufenden Schema rekonstruiert.
--
--    Idempotent (create table if not exists / drop policy if exists). Anwenden:
--    Supabase SQL-Editor bzw. /pg/query (DB-Port extern zu).
-- =====================================================================

set search_path to wimus, public;
create extension if not exists pgcrypto;

-- updated_at-Helper existiert bereits (002), zur Sicherheit idempotent:
create or replace function wimus.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) workspaces  (Wurzel der Org-Hierarchie)
-- ---------------------------------------------------------------------
create table if not exists wimus.workspaces (
  id                 uuid primary key default gen_random_uuid(),
  kuerzel            varchar(10) not null unique,
  name               varchar(255) not null,
  inhaber            varchar(255),
  strasse            varchar(255),
  hausnummer         varchar(20),
  plz                varchar(10),
  stadt              varchar(100),
  land               varchar(50) default 'DE',
  telefon            varchar(50),
  email              varchar(255),
  website            varchar(255),
  logo_url           varchar(500),
  logo_dunkel_url    varchar(500),
  ci_farbe_primary   varchar(7) default '1F4E5F',
  ci_farbe_secondary varchar(7) default '2E75B6',
  aktiv              boolean default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2) firmen  (Buchungskreise; Selbst-FK für Holding-Struktur)
-- ---------------------------------------------------------------------
create table if not exists wimus.firmen (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references wimus.workspaces(id),
  mutter_firma_id         uuid references wimus.firmen(id),
  name                    varchar(255) not null,
  kuerzel                 varchar(10),
  rechtsform              varchar(50),
  typ                     varchar(20) check (typ in ('privat','operativ','vvGmbH','GbR','holding','sonstige')),
  geschaeftsfuehrer       varchar(255),
  prokuristen             text,
  handelsregister_nr      varchar(50),
  handelsregister_gericht varchar(100),
  gruendungsdatum         date,
  stammkapital            numeric(15,2),
  beteiligung_pct         numeric(5,2),
  steuernummer            varchar(50),
  ust_id                  varchar(50),
  steueramt               varchar(100),
  wirtschaftsjahr_start   integer default 1,
  umsatzsteuer_typ        varchar(20) check (umsatzsteuer_typ in ('regelbesteuerung','kleinunternehmer','istversteuerung','sollversteuerung')),
  umsatzsteuer_period     varchar(20) check (umsatzsteuer_period in ('monatlich','quartalsweise','jaehrlich')),
  datev_berater_nr        varchar(20),
  datev_mandant_nr        varchar(20),
  bank_name               varchar(100),
  iban                    varchar(50),
  bic                     varchar(20),
  kontoinhaber            varchar(255),
  strasse                 varchar(255),
  hausnummer              varchar(20),
  plz                     varchar(10),
  stadt                   varchar(100),
  stadtteil               varchar(100),
  land                    varchar(50) default 'DE',
  telefon                 varchar(50),
  telefon_2               varchar(50),
  fax                     varchar(50),
  email                   varchar(255),
  website                 varchar(255),
  logo_url                varchar(500),
  logo_dunkel_url         varchar(500),
  ci_farbe_primary        varchar(7),
  ci_farbe_secondary      varchar(7),
  impressum_url           varchar(500),
  datenschutz_url         varchar(500),
  aktiv                   boolean default true,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  rechtsform_typ          text check (rechtsform_typ is null or rechtsform_typ in ('kapitalgesellschaft','personengesellschaft','privat')),
  besteuerungsart         text check (besteuerungsart is null or besteuerungsart in ('bilanz','euer','ueberschuss')),
  kontenrahmen_ref        text
);

-- ---------------------------------------------------------------------
-- 3) projekte  (Marken/Vorhaben; Selbst-FK für Baum, ebene/pfad, projektmanager → akteure)
-- ---------------------------------------------------------------------
create table if not exists wimus.projekte (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references wimus.workspaces(id),
  firma_id             uuid references wimus.firmen(id),
  parent_projekt_id    uuid references wimus.projekte(id),
  ebene                integer default 0,
  pfad                 text,
  kuerzel              varchar(20) not null,
  name                 varchar(255) not null,
  typ                  varchar(30) check (typ in ('kzv','monteur','wg','hausverwaltung','development','ankauf','bauprojekt','r2r','sonstige')),
  status               varchar(20) default 'aktiv' check (status in ('planung','aktiv','abgeschlossen','pausiert')),
  start_datum          date,
  end_datum            date,
  budget               numeric(15,2),
  projektmanager_id    uuid,   -- FK → akteure konditional unten (akteure ggf. spätere Migration)
  marke                varchar(100),
  logo_url             varchar(500),
  logo_dunkel_url      varchar(500),
  ci_farbe_primary     varchar(7),
  ci_farbe_secondary   varchar(7),
  domain               varchar(255),
  email                varchar(255),
  telefon              varchar(50),
  whatsapp             varchar(50),
  website              varchar(255),
  instagram_url        varchar(255),
  google_profil_url    varchar(255),
  gaestemappe_domain   varchar(255),
  impressum_url        varchar(500),
  datenschutz_url      varchar(500),
  beds24_property_id   varchar(100),
  beds24_api_key       text,            -- ⚠️ Secret im Klartext (s. Backlog: API-Keys verschlüsseln)
  pricelabs_id         varchar(100),
  airbnb_user_id       varchar(100),
  booking_property_id  varchar(100),
  retell_agent_id      varchar(100),
  ttlock_gateway_id    varchar(100),
  tuya_scene_prefix    varchar(100),
  citytax_pflichtig    boolean default false,
  citytax_gemeinde     varchar(50),
  citytax_satz         numeric(4,2),
  meldeschein_pflichtig boolean default false,
  meldeschein_behoerde varchar(100),
  ci_config            jsonb,
  kpi_config           jsonb,
  aktiv                boolean default true,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- projektmanager_id → akteure: nur setzen, wenn akteure existiert (entkoppelt 004 von akteure-Migration)
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='wimus' and table_name='akteure')
     and not exists (select 1 from information_schema.table_constraints
             where table_schema='wimus' and table_name='projekte'
               and constraint_name='fk_projekte_projektmanager') then
    alter table wimus.projekte
      add constraint fk_projekte_projektmanager
      foreign key (projektmanager_id) references wimus.akteure(id);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4) Indizes (wie live)
-- ---------------------------------------------------------------------
create index if not exists idx_projekte_firma     on wimus.projekte (firma_id);
create index if not exists idx_projekte_parent    on wimus.projekte (parent_projekt_id);
create index if not exists idx_projekte_workspace on wimus.projekte (workspace_id);

-- ---------------------------------------------------------------------
-- 5) updated_at-Trigger (wie live)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['workspaces','firmen','projekte'] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on wimus.%1$s', t);
    execute format('create trigger trg_%1$s_updated_at before update on wimus.%1$s
                      for each row execute function wimus.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 6) RLS (wie live: aktiv, eine Read-Policy für anon/authenticated;
--    Schreiben nur über Service-Role. Künftige rollenbasierte Write-
--    Policies → Modul 010_berechtigungen, NICHT hier.)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['workspaces','firmen','projekte'] loop
    execute format('alter table wimus.%I enable row level security', t);
    execute format('drop policy if exists p_org_read on wimus.%I', t);
    execute format('create policy p_org_read on wimus.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Kontrolle nach dem Lauf:
--   select (select count(*) from wimus.workspaces) as ws,
--          (select count(*) from wimus.firmen)     as firmen,
--          (select count(*) from wimus.projekte)   as projekte;
-- Erwartung (Seed aus 006): ws=1, firmen=3, projekte≥5.
-- =====================================================================
