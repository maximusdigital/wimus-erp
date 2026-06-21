-- =====================================================================
-- WIMUS ERP – Initiales Schema (Phase 0)
-- Migration: 001_initial_schema.sql
--
-- Pflichtregeln (CLAUDE.md):
--   * Jede Kerntabelle hat mandant_id (FK auf mandanten)
--   * RLS auf ALLEN Tabellen aktiv
--   * Policy: nur eigener Mandant sichtbar (über user_mandanten)
--   * Standardspalten: id, created_at, updated_at, mandant_id
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 0a. Helper: updated_at automatisch pflegen
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 0b. Helper: Mandanten des aktuellen Users (SECURITY DEFINER, damit
--     RLS-Checks auf user_mandanten keine Rekursion auslösen)
-- ---------------------------------------------------------------------
create or replace function public.current_user_mandanten()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select mandant_id
  from public.user_mandanten
  where user_id = auth.uid()
$$;

-- =====================================================================
-- 1. mandanten  (Wurzel – Mehrmarken-Mandanten)
-- =====================================================================
create table public.mandanten (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  name          text not null,
  kuerzel       text unique,
  rechtsform    text,
  iban          text,
  datev_mandant text,
  briefkopf_url text,
  farbe         text,
  aktiv         boolean not null default true
);

-- =====================================================================
-- 2. user_mandanten  (Zuordnung User -> Mandant, n:m)
-- =====================================================================
create table public.user_mandanten (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  mandant_id uuid not null references public.mandanten(id) on delete cascade,
  rolle      text not null default 'mitarbeiter',  -- admin | mitarbeiter | gast
  unique (user_id, mandant_id)
);

-- =====================================================================
-- 3. gesellschaften  (Eigentümergesellschaften / Objektgesellschaften)
-- =====================================================================
create table public.gesellschaften (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  name          text not null,
  rechtsform    text,
  handelsregister text,
  steuernummer  text,
  ust_id        text,
  sitz          text
);

-- =====================================================================
-- 4. objekte
-- =====================================================================
create table public.objekte (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  mandant_id             uuid not null references public.mandanten(id) on delete cascade,
  gesellschaft_id        uuid references public.gesellschaften(id) on delete set null,
  kuerzel                text not null,
  bezeichnung            text,
  strasse                text,
  hausnummer             text,
  plz                    text,
  ort                    text,
  objekttyp              text,                 -- EW | MFH | EFH | R2R-KZV | ...
  baujahr                integer,
  wohnflaeche_qm         numeric(10,2),
  grundstuecksflaeche_qm numeric(10,2),
  nutzen_lasten_datum    date,                 -- Start 15%-Grenze §6 EStG
  notartermin_datum      date,                 -- Start 10J-Frist §23 EStG
  haltestrategie         text,                 -- bestand | r2r | flip | development
  marktwert_sprengnetter numeric(14,2),
  marktwert_pricehubble  numeric(14,2),
  status                 text not null default 'ist',  -- ist | akquise | verkauft | ...
  notiz                  text,
  unique (mandant_id, kuerzel)
);

-- =====================================================================
-- 5. einheiten
-- =====================================================================
create table public.einheiten (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  mandant_id          uuid not null references public.mandanten(id) on delete cascade,
  objekt_id           uuid not null references public.objekte(id) on delete cascade,
  bezeichnung         text,
  lage                text,                    -- z.B. "EG links", "2. OG"
  verwendungszweck_code text,                  -- z.B. BHS16W3Z1
  einheitstyp         text,                    -- wohnung | zimmer | gewerbe | stellplatz | garage
  wohnflaeche_qm      numeric(10,2),
  zimmer_anzahl       numeric(4,1),
  etage               text,
  status              text not null default 'frei',  -- frei | vermietet | eigennutzung | ...
  unique (mandant_id, verwendungszweck_code)
);

-- =====================================================================
-- 6. kontakte  (Mieter / Eigentümer / Dienstleister / Gläubiger ...)
-- =====================================================================
create table public.kontakte (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  mandant_id            uuid not null references public.mandanten(id) on delete cascade,
  typ                   text not null default 'mieter',  -- mieter | eigentuemer | dienstleister | glaeubiger | gast | behoerde
  anrede                text,
  vorname               text,
  nachname              text,
  firma                 text,
  email                 text,
  telefon               text,
  strasse               text,
  plz                   text,
  ort                   text,
  ausweis_nr            text,
  dsgvo_datenweitergabe boolean not null default false,
  dsgvo_einwilligung_am timestamptz,
  notiz                 text
);

-- =====================================================================
-- 7. vertraege
-- =====================================================================
create table public.vertraege (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  mandant_id            uuid not null references public.mandanten(id) on delete cascade,
  einheit_id            uuid references public.einheiten(id) on delete set null,
  objekt_id             uuid references public.objekte(id) on delete set null,
  mieter_id             uuid references public.kontakte(id) on delete set null,
  vertragsart           text,                  -- V01 | V02 | V03 | V04
  vertragsnummer        text,
  beginn                date,
  ende                  date,
  unbefristet           boolean not null default true,
  grundmiete            numeric(12,2),
  bk_pauschale          numeric(12,2),         -- Betriebskosten
  heizkosten_pauschale  numeric(12,2),
  strompauschale        numeric(12,2),
  faelligkeitsregel     text,                  -- z.B. "3. Werktag des Monats"
  kdu_id                uuid,                  -- Verknüpfung Kosten der Unterkunft (Jobcenter)
  kaution_id            uuid,
  status                text not null default 'aktiv',  -- aktiv | gekuendigt | beendet | entwurf
  constraint vertraege_vertragsart_chk
    check (vertragsart is null or vertragsart in ('V01','V02','V03','V04'))
);

-- =====================================================================
-- 8. buchungen_kzv  (Kurzzeitvermietung / Beds24)
-- =====================================================================
create table public.buchungen_kzv (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  mandant_id  uuid not null references public.mandanten(id) on delete cascade,
  einheit_id  uuid references public.einheiten(id) on delete set null,
  objekt_id   uuid references public.objekte(id) on delete set null,
  gast_id     uuid references public.kontakte(id) on delete set null,
  beds24_id   text,
  kanal       text,                            -- airbnb | booking | direkt | ...
  checkin     timestamptz,
  checkout    timestamptz,
  personen    integer,
  nuki_code   text,
  tuya_szene  text,
  betrag      numeric(12,2),
  city_tax    numeric(12,2),
  status      text not null default 'bestaetigt',  -- angefragt | bestaetigt | storniert | checked_in | checked_out
  unique (mandant_id, beds24_id)
);

-- =====================================================================
-- 9. vorgaenge  (P14 Vorgangsmanagement)
-- =====================================================================
create table public.vorgaenge (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  objekt_id     uuid references public.objekte(id) on delete set null,
  einheit_id    uuid references public.einheiten(id) on delete set null,
  titel         text not null,
  beschreibung  text,
  typ           text,                          -- schaden | reparatur | anfrage | kuendigung | ...
  prioritaet    text not null default 'normal',  -- niedrig | normal | hoch | kritisch
  kostentraeger text,                          -- vermieter | mieter | versicherung | weg
  faellig_am    date,
  status        text not null default 'offen'  -- offen | in_arbeit | wartet | erledigt | abgebrochen
);

-- =====================================================================
-- 10. mahnungen
-- =====================================================================
create table public.mahnungen (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  mandant_id     uuid not null references public.mandanten(id) on delete cascade,
  vertrag_id     uuid references public.vertraege(id) on delete set null,
  mieter_id      uuid references public.kontakte(id) on delete set null,
  stufe          integer not null default 1,   -- 1 | 2 | 3 | inkasso
  hauptforderung numeric(12,2) not null default 0,
  zinsen         numeric(12,2) not null default 0,
  gebuehren      numeric(12,2) not null default 0,
  gesamt         numeric(12,2) not null default 0,
  faellig_am     date,
  versendet_am   date,
  status         text not null default 'offen'  -- offen | versendet | bezahlt | inkasso | erledigt
);

-- =====================================================================
-- 11. kautionen
-- =====================================================================
create table public.kautionen (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  mandant_id  uuid not null references public.mandanten(id) on delete cascade,
  vertrag_id  uuid references public.vertraege(id) on delete set null,
  mieter_id   uuid references public.kontakte(id) on delete set null,
  betrag      numeric(12,2) not null default 0,
  anlage_art  text,                            -- sparbuch | mietkautionskonto | buergschaft | bar
  zinssatz    numeric(6,4),
  bank        text,
  iban        text,
  status      text not null default 'angelegt'  -- angelegt | hinterlegt | abgerechnet | ausgezahlt
);

-- =====================================================================
-- 12. finanzierungen
-- =====================================================================
create table public.finanzierungen (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  objekt_id     uuid references public.objekte(id) on delete set null,
  glaeubiger_id uuid references public.kontakte(id) on delete set null,
  glaeubiger    text,                          -- Bank/Name (Freitext-Fallback)
  darlehensnummer text,
  darlehen      numeric(14,2),                 -- ursprüngliche Darlehenssumme
  valuta        numeric(14,2),                 -- aktueller Restschuld-Valutastand
  zinssatz      numeric(6,4),
  zinsbindung_bis date,
  tilgung_prozent numeric(6,4),
  bela_ist      numeric(12,2),                 -- Belastung IST (p.a. / p.m.)
  bela_soll     numeric(12,2),                 -- Belastung SOLL
  status        text not null default 'aktiv'  -- aktiv | abgeloest | umgeschuldet
);

-- =====================================================================
-- 13. grundbuch
-- =====================================================================
create table public.grundbuch (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  objekt_id     uuid references public.objekte(id) on delete cascade,
  abteilung     integer,                       -- I | II | III  (1|2|3)
  typ           text,                          -- grundschuld | hypothek | wegerecht | nießbrauch | ...
  rang          integer,
  glaeubiger_id uuid references public.kontakte(id) on delete set null,
  betrag        numeric(14,2),
  text_inhalt   text,
  eingetragen_am date
);

-- =====================================================================
-- 14. asset_register  (Inventar / Ausstattung)
-- =====================================================================
create table public.asset_register (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  mandant_id   uuid not null references public.mandanten(id) on delete cascade,
  objekt_id    uuid references public.objekte(id) on delete set null,
  einheit_id   uuid references public.einheiten(id) on delete set null,
  bezeichnung  text not null,
  typ          text,                           -- moebel | geraet | schluessel | smart_device | ...
  asset_code   text,
  zustand      text,                           -- neu | gut | gebraucht | defekt
  standort_typ text,                           -- objekt | einheit | lager | unterwegs
  anschaffung_am date,
  anschaffung_wert numeric(12,2),
  unique (mandant_id, asset_code)
);

-- =====================================================================
-- 15. afa_optimierungen  (AfA-Optimierung Kaufpreisaufteilung / Restnutzungsdauer)
-- =====================================================================
create table public.afa_optimierungen (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  mandant_id   uuid not null references public.mandanten(id) on delete cascade,
  objekt_id    uuid references public.objekte(id) on delete cascade,
  typ          text,                           -- kpa (Kaufpreisaufteilung) | rnd (Restnutzungsdauer)
  ausgangswert numeric(14,2),
  optimiert    numeric(14,2),
  ersparnis_pa numeric(14,2),
  gutachten_url text,
  status       text not null default 'offen',  -- offen | beantragt | anerkannt | abgelehnt
  constraint afa_optimierungen_typ_chk
    check (typ is null or typ in ('kpa','rnd'))
);

-- =====================================================================
-- 16. objekt_phasen  (Phasenmodell / Development-Szenarien)
-- =====================================================================
create table public.objekt_phasen (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  objekt_id     uuid references public.objekte(id) on delete cascade,
  bezeichnung   text,
  phase_nr      integer,
  einheiten_mix jsonb,                         -- {"wohnung": 4, "gewerbe": 1, ...}
  ertraege_pa   numeric(14,2),                 -- Erträge p.a.
  jre           numeric(14,2),                 -- Jahresreinertrag
  guv           numeric(14,2),                 -- Gewinn/Verlust
  rendite       numeric(6,4),
  status        text not null default 'plan'   -- plan | laufend | abgeschlossen
);

-- =====================================================================
-- 17. vorlagen  (Vertrags-/Brief-/Rechnungsvorlagen mit Variablen)
-- =====================================================================
create table public.vorlagen (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  mandant_id           uuid not null references public.mandanten(id) on delete cascade,
  name                 text not null,
  kategorie            text,                   -- vertrag | mahnung | brief | rechnung | email
  inhalt_mit_variablen text,                   -- z.B. "Sehr geehrte/r {{anrede}} {{nachname}} ..."
  aktiv                boolean not null default true
);

-- =====================================================================
-- 18. provisionsfaelle  (Makler-/Vermittlungsprovisionen)
-- =====================================================================
create table public.provisionsfaelle (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  objekt_id     uuid references public.objekte(id) on delete set null,
  kontakt_id    uuid references public.kontakte(id) on delete set null,
  art           text,                          -- ankauf | verkauf | vermietung
  bemessung     numeric(14,2),
  satz_prozent  numeric(6,4),
  provision     numeric(14,2),
  faellig_am    date,
  status        text not null default 'offen'  -- offen | berechnet | bezahlt
);

-- =====================================================================
-- 19. entmietungen  (Entmietungs-/Räumungsvorgänge)
-- =====================================================================
create table public.entmietungen (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  mandant_id    uuid not null references public.mandanten(id) on delete cascade,
  objekt_id     uuid references public.objekte(id) on delete set null,
  einheit_id    uuid references public.einheiten(id) on delete set null,
  vertrag_id    uuid references public.vertraege(id) on delete set null,
  mieter_id     uuid references public.kontakte(id) on delete set null,
  grund         text,                          -- eigenbedarf | abriss | modernisierung | aufhebung
  abfindung     numeric(14,2),
  ziel_datum    date,
  status        text not null default 'geplant'  -- geplant | verhandlung | vereinbart | abgeschlossen | klage
);

-- =====================================================================
-- 20. mietanpassungen  (§558 / §559 BGB)
-- =====================================================================
create table public.mietanpassungen (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  mandant_id      uuid not null references public.mandanten(id) on delete cascade,
  vertrag_id      uuid references public.vertraege(id) on delete set null,
  einheit_id      uuid references public.einheiten(id) on delete set null,
  rechtsgrundlage text,                        -- §558 | §559 | indexmiete | staffelmiete
  alt_miete       numeric(12,2),
  neu_miete       numeric(12,2),
  erhoehung_prozent numeric(6,4),
  wirksam_ab      date,
  angekuendigt_am date,
  status          text not null default 'entwurf'  -- entwurf | angekuendigt | wirksam | abgelehnt
);

-- =====================================================================
-- 21. sechsb_ruecklagen  (§6b EStG-Rücklagen)
-- =====================================================================
create table public.sechsb_ruecklagen (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  mandant_id         uuid not null references public.mandanten(id) on delete cascade,
  herkunft_objekt_id uuid references public.objekte(id) on delete set null,
  ziel_objekt_id     uuid references public.objekte(id) on delete set null,
  betrag             numeric(14,2),
  gebildet_am        date,                     -- Bildung der Rücklage
  reinvest_frist     date,                     -- 4 Jahre (6J bei Neubau)
  verzinsung_prozent numeric(6,4) default 6.0, -- 6% p.a. bei Nichtreinvestition
  status             text not null default 'gebildet'  -- gebildet | reinvestiert | aufgeloest
);

-- =====================================================================
-- 22. objektverkaeufe
-- =====================================================================
create table public.objektverkaeufe (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  mandant_id        uuid not null references public.mandanten(id) on delete cascade,
  objekt_id         uuid references public.objekte(id) on delete set null,
  kaeufer_id        uuid references public.kontakte(id) on delete set null,
  verkaufspreis     numeric(14,2),
  notartermin_datum date,
  nutzen_lasten_datum date,
  spekulationssteuer_relevant boolean,         -- §23 EStG <10J
  gewinn            numeric(14,2),
  status            text not null default 'angebahnt'  -- angebahnt | beurkundet | abgewickelt | geplatzt
);

-- =====================================================================
-- updated_at-Trigger für alle Tabellen
-- =====================================================================
do $$
declare
  t text;
  tabellen text[] := array[
    'mandanten','user_mandanten','gesellschaften','objekte','einheiten',
    'kontakte','vertraege','buchungen_kzv','vorgaenge','mahnungen',
    'kautionen','finanzierungen','grundbuch','asset_register',
    'afa_optimierungen','objekt_phasen','vorlagen','provisionsfaelle',
    'entmietungen','mietanpassungen','sechsb_ruecklagen','objektverkaeufe'
  ];
begin
  foreach t in array tabellen loop
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

-- RLS auf allen Tabellen aktivieren
alter table public.mandanten         enable row level security;
alter table public.user_mandanten    enable row level security;
alter table public.gesellschaften    enable row level security;
alter table public.objekte           enable row level security;
alter table public.einheiten         enable row level security;
alter table public.kontakte          enable row level security;
alter table public.vertraege         enable row level security;
alter table public.buchungen_kzv     enable row level security;
alter table public.vorgaenge         enable row level security;
alter table public.mahnungen         enable row level security;
alter table public.kautionen         enable row level security;
alter table public.finanzierungen    enable row level security;
alter table public.grundbuch         enable row level security;
alter table public.asset_register    enable row level security;
alter table public.afa_optimierungen enable row level security;
alter table public.objekt_phasen     enable row level security;
alter table public.vorlagen          enable row level security;
alter table public.provisionsfaelle  enable row level security;
alter table public.entmietungen      enable row level security;
alter table public.mietanpassungen   enable row level security;
alter table public.sechsb_ruecklagen enable row level security;
alter table public.objektverkaeufe   enable row level security;

-- Spezialfall mandanten: Sichtbar, wenn User dem Mandanten zugeordnet ist
create policy "mandant_isolation" on public.mandanten
  for all
  using  (id in (select public.current_user_mandanten()))
  with check (id in (select public.current_user_mandanten()));

-- Spezialfall user_mandanten: User sieht nur seine eigenen Zuordnungen
create policy "user_eigene_zuordnung" on public.user_mandanten
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Alle Kerntabellen: nur eigener Mandant sichtbar/änderbar
do $$
declare
  t text;
  tabellen text[] := array[
    'gesellschaften','objekte','einheiten','kontakte','vertraege',
    'buchungen_kzv','vorgaenge','mahnungen','kautionen','finanzierungen',
    'grundbuch','asset_register','afa_optimierungen','objekt_phasen',
    'vorlagen','provisionsfaelle','entmietungen','mietanpassungen',
    'sechsb_ruecklagen','objektverkaeufe'
  ];
begin
  foreach t in array tabellen loop
    execute format(
      'create policy "mandant_isolation" on public.%1$s
         for all
         using  (mandant_id in (select public.current_user_mandanten()))
         with check (mandant_id in (select public.current_user_mandanten()))', t);
  end loop;
end;
$$;

-- =====================================================================
-- Indizes auf mandant_id (Performance für RLS-Filter)
-- =====================================================================
do $$
declare
  t text;
  tabellen text[] := array[
    'gesellschaften','objekte','einheiten','kontakte','vertraege',
    'buchungen_kzv','vorgaenge','mahnungen','kautionen','finanzierungen',
    'grundbuch','asset_register','afa_optimierungen','objekt_phasen',
    'vorlagen','provisionsfaelle','entmietungen','mietanpassungen',
    'sechsb_ruecklagen','objektverkaeufe'
  ];
begin
  foreach t in array tabellen loop
    execute format(
      'create index idx_%1$s_mandant on public.%1$s (mandant_id)', t);
  end loop;
end;
$$;

create index idx_user_mandanten_user on public.user_mandanten (user_id);
create index idx_einheiten_objekt    on public.einheiten (objekt_id);
create index idx_vertraege_einheit   on public.vertraege (einheit_id);
create index idx_vertraege_mieter    on public.vertraege (mieter_id);
create index idx_buchungen_einheit   on public.buchungen_kzv (einheit_id);
