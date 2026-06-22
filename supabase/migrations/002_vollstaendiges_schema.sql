-- =====================================================================
-- WIMUS ERP – Migration 002: Vollständiges Schema (v5)
-- Basis: Übergabedokument v5.0, Kapitel 5 (Datenmodell, 82 Tabellen)
--
-- Schema:     wimus   (additiv – Schema `public`/Phase-1-CRUD bleibt unberührt)
-- Konvention: Plural, kein Prefix
--   Adresse IMMER getrennt: strasse, hausnummer, plz, stadt, stadtteil, land
--   Anrede:  Herr / Frau / Firma / Keine
--   created_at / updated_at TIMESTAMPTZ auf allen Tabellen
--   mandant_id auf allen Kerntabellen, RLS mandant_isolation auf allen Tabellen
--   Aktenzeichen: Auto via Trigger (vorgaenge)
--
-- Hinweis: v5 deklariert 82 Tabellen; der Fließtext spezifiziert ~40 mit
-- Spalten, die Gruppensummen ergeben 77. Diese Migration legt alle in v5
-- benannten Tabellen an (Spalten laut Doku wo vorhanden, sonst konventions-
-- konform). Bei späterer Voll-Enumeration der 82 Tabellen ergänzbar.
--
-- PostgREST/Supabase: Schema `wimus` exponieren (PGRST_DB_SCHEMAS="public,wimus").
-- =====================================================================

create schema if not exists wimus;
create extension if not exists pgcrypto;

-- generische updated_at-Pflege
create or replace function wimus.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- GRUPPE 1 – KERN
-- =====================================================================

create table wimus.rollen (
  id           uuid primary key default gen_random_uuid(),
  name         varchar(50) not null unique,
  typ          varchar(20) not null check (typ in ('system','mandant','extern')),
  beschreibung text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.mandanten (
  id               uuid primary key default gen_random_uuid(),
  kuerzel          varchar(10) unique,
  name             varchar(255) not null,
  rechtsform       varchar(50),
  strasse          varchar(255),
  hausnummer       varchar(20),
  plz              varchar(10),
  stadt            varchar(255),
  land             varchar(100) default 'Deutschland',
  iban             varchar(34),
  datev_mandant_nr varchar(20),
  ci_farbe_primary varchar(7),
  logo_url         varchar(500),
  aktiv            boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.benutzer (
  id            uuid primary key references auth.users(id) on delete cascade,
  mandant_id    uuid references wimus.mandanten(id) on delete set null,
  email         varchar(255) unique,
  vorname       varchar(255),
  nachname      varchar(255),
  aktiv         boolean not null default true,
  mfa_aktiv     boolean not null default false,
  letzter_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.benutzer_rollen (
  id          uuid primary key default gen_random_uuid(),
  benutzer_id uuid not null references wimus.benutzer(id) on delete cascade,
  rolle_id    uuid not null references wimus.rollen(id) on delete restrict,
  mandant_id  uuid references wimus.mandanten(id) on delete cascade,
  gueltig_von timestamptz,
  gueltig_bis timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (benutzer_id, rolle_id, mandant_id)
);

create table wimus.gesellschaften (
  id               uuid primary key default gen_random_uuid(),
  mandant_id       uuid not null references wimus.mandanten(id) on delete cascade,
  name             varchar(255) not null,
  kuerzel          varchar(10),
  typ              varchar(20) check (typ in ('privat','operativ','vvGmbH','GbR')),
  versteuerungsart varchar(50),
  ust_id           varchar(50),
  steuernummer     varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.kontakte (
  id                  uuid primary key default gen_random_uuid(),
  mandant_id          uuid not null references wimus.mandanten(id) on delete cascade,
  firma_id            uuid references wimus.kontakte(id) on delete set null,
  kontakt_typ         varchar(20) check (kontakt_typ in ('person','firma')),
  anrede              varchar(20) check (anrede in ('Herr','Frau','Firma','Keine')),
  vorname             varchar(255),
  nachname            varchar(255),
  firmenname          varchar(255),
  rechtsform          varchar(50),
  strasse             varchar(255),
  hausnummer          varchar(20),
  plz                 varchar(10),
  stadt               varchar(255),
  land                varchar(100) default 'Deutschland',
  email               varchar(255),
  telefon_mobil       varchar(50),
  telefon_festnetz    varchar(50),
  iban                varchar(34),
  bic                 varchar(20),
  debitor_nr          varchar(20),
  kreditor_nr         varchar(20),
  zahlungsziel_tage   integer,
  ist_mieter          boolean not null default false,
  ist_eigentuemer     boolean not null default false,
  ist_dienstleister   boolean not null default false,
  ist_makler          boolean not null default false,
  ist_tippgeber       boolean not null default false,
  ist_bank            boolean not null default false,
  dsgvo_datenweitergabe boolean not null default false,
  sprache             varchar(5) default 'de',
  aktiv               boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.kommunikationskanaele (
  id            uuid primary key default gen_random_uuid(),
  mandant_id    uuid not null references wimus.mandanten(id) on delete cascade,
  kanal_typ     varchar(20) check (kanal_typ in ('email','whatsapp','sms','telefon')),
  bezeichnung   varchar(255),
  wert          varchar(255),
  konfiguration jsonb,
  ist_standard  boolean not null default false,
  aktiv         boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.objekte (
  id                     uuid primary key default gen_random_uuid(),
  mandant_id             uuid not null references wimus.mandanten(id) on delete cascade,
  gesellschaft_id        uuid references wimus.gesellschaften(id) on delete set null,
  kuerzel                varchar(20),
  strasse                varchar(255),
  hausnummer             varchar(20),
  plz                    varchar(10),
  stadt                  varchar(255),
  stadtteil              varchar(255),
  land                   varchar(100) default 'Deutschland',
  latitude               decimal(9,6),
  longitude              decimal(9,6),
  typ                    varchar(50),
  baujahr                integer,
  status                 varchar(30),
  haltestrategie         varchar(50),
  nutzen_lasten_datum    date,
  notartermin_datum      date,
  marktwert_sprengnetter decimal(15,2),
  marktwert_pricehubble  decimal(15,2),
  zweckentfremdung_nr    varchar(100),
  zweckentfremdung_bis   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheiten (
  id                   uuid primary key default gen_random_uuid(),
  objekt_id            uuid not null references wimus.objekte(id) on delete cascade,
  kuerzel              varchar(50),
  bezeichnung          varchar(255),
  typ                  varchar(50),
  lage                 varchar(255),
  flaeche              decimal(8,2),
  zimmer               integer,
  schlafzimmer         integer,
  baeder               integer,
  max_personen         integer,
  verwendungszweck_code varchar(50),
  etage_beschreibung   varchar(255),
  keybox_vorhanden     boolean not null default false,
  keybox_standort      varchar(255),
  keybox_pin_statisch  varchar(20),
  anleitung_url        varchar(500),
  gaestemappe_url_slug varchar(100),
  aktiv                boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.objekt_emails (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  bezug_typ  varchar(20) check (bezug_typ in ('objekt','einheit')),
  bezug_id   uuid,                       -- polymorph (objekt/einheit)
  email      varchar(255),
  zweck      varchar(100),
  aktiv      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.zertifikate_lizenzen (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id  uuid references wimus.objekte(id) on delete set null,
  typ        varchar(100),
  bezeichnung varchar(255),
  ausgestellt_am date,
  gueltig_bis date,
  dokument_url varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- GRUPPE 3 – EINHEIT-DETAILS, AUSSTATTUNG, ZÄHLER, CUSTOM FIELDS
-- =====================================================================

create table wimus.ausstattungs_kategorien (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  name       varchar(100),
  reihenfolge integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.ausstattungen (
  id          uuid primary key default gen_random_uuid(),
  kategorie_id uuid not null references wimus.ausstattungs_kategorien(id) on delete cascade,
  name        varchar(255),
  icon        varchar(100),
  airbnb_id   varchar(50),
  booking_id  varchar(50),
  ist_standard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheit_ausstattungen (
  id            uuid primary key default gen_random_uuid(),
  einheit_id    uuid not null references wimus.einheiten(id) on delete cascade,
  ausstattung_id uuid not null references wimus.ausstattungen(id) on delete cascade,
  vorhanden     boolean not null default true,
  notiz         varchar(500),
  gegen_aufpreis boolean not null default false,
  auf_anfrage   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheit_hausregeln (
  id               uuid primary key default gen_random_uuid(),
  einheit_id       uuid not null references wimus.einheiten(id) on delete cascade,
  sprache          varchar(5) default 'de',
  haustiere_erlaubt boolean,
  rauchen_erlaubt  boolean,
  check_in_von     time,
  check_in_bis     time,
  check_out_bis    time,
  ruhezeiten_von   time,
  ruhezeiten_bis   time,
  max_gaeste       integer,
  rauch_strafe     decimal(10,2),
  muell_strafe     decimal(10,2),
  unautorisiert_preis decimal(10,2),
  gueltig_ab       date,                  -- Versionierung
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.gaestemappe_inhalte (
  id                 uuid primary key default gen_random_uuid(),
  einheit_id         uuid not null references wimus.einheiten(id) on delete cascade,
  sprache            varchar(5) default 'de',   -- de/en/ru
  checkin_system_text text,
  checkin_anleitung  text,
  parken_text        text,
  parken_maps_url    varchar(500),
  notruf_polizei     varchar(20),
  notruf_feuerwehr   varchar(20),
  wifi_ssid          varchar(100),
  wifi_passwort      text,                       -- verschlüsselt
  hausregeln_text    text,
  sonstige_infos     text,
  gueltig_ab         date,                       -- Versionierung
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheit_sicherheit (
  id                  uuid primary key default gen_random_uuid(),
  einheit_id          uuid not null references wimus.einheiten(id) on delete cascade,
  rauchmelder         boolean,
  kohlenmonoxidmelder boolean,
  feuerloescher       boolean,
  ueberwachungskamera boolean,
  kamera_beschreibung text,
  aufzug_vorhanden    boolean,
  barrierefrei        boolean,
  parkplatz_beschreibung text,
  gueltig_ab          date,                      -- Versionierung
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheit_bettenstruktur (
  id          uuid primary key default gen_random_uuid(),
  einheit_id  uuid not null references wimus.einheiten(id) on delete cascade,
  raum        varchar(100),
  bett_typ    varchar(50),                       -- doppelbett/einzelbett/sofa/...
  anzahl      integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheit_fotos (
  id          uuid primary key default gen_random_uuid(),
  einheit_id  uuid not null references wimus.einheiten(id) on delete cascade,
  url         varchar(500) not null,
  titel       varchar(255),
  reihenfolge integer,
  ist_titelbild boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einheit_pois (
  id          uuid primary key default gen_random_uuid(),
  einheit_id  uuid not null references wimus.einheiten(id) on delete cascade,
  kategorie   varchar(100),                      -- supermarkt/restaurant/oepnv/...
  name        varchar(255),
  entfernung_m integer,
  maps_url    varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.versorgervertraege (
  id                uuid primary key default gen_random_uuid(),
  mandant_id        uuid not null references wimus.mandanten(id) on delete cascade,
  bezug_typ         varchar(20) check (bezug_typ in ('objekt','einheit')),
  bezug_id          uuid,                         -- polymorph
  kategorie         varchar(30),                  -- strom/gas/wasser/...
  anbieter          varchar(255),
  vertragspartner_id uuid references wimus.kontakte(id) on delete set null,
  kundennummer      varchar(100),
  vertragsnummer    varchar(100),
  vertragsbeginn    date,
  vertragsende      date,
  preis_monatlich   decimal(10,2),
  status            varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.zaehler (
  id                 uuid primary key default gen_random_uuid(),
  mandant_id         uuid not null references wimus.mandanten(id) on delete cascade,
  bezug_typ          varchar(20) check (bezug_typ in ('objekt','einheit')),
  bezug_id           uuid,                        -- polymorph
  versorgervertrag_id uuid references wimus.versorgervertraege(id) on delete set null,
  typ                varchar(20) check (typ in ('strom','gas','wasser','waerme')),
  zaehlernummer      varchar(100),
  einbauort          varchar(255),
  eichpflicht_bis    date,
  aktiv              boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.zaehlerstaende (
  id            uuid primary key default gen_random_uuid(),
  zaehler_id    uuid not null references wimus.zaehler(id) on delete cascade,
  stand         decimal(12,4),
  einheit       varchar(10) check (einheit in ('kWh','m³','MWh','GJ')),
  ablesedatum   date,
  ableseart     varchar(10) check (ableseart in ('manuell','funk','foto','api')),
  foto_url      varchar(500),
  abgelesen_von uuid references wimus.kontakte(id) on delete set null,
  ist_schaetzwert boolean not null default false,
  validiert     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_zaehlerstaende_zeitreihe on wimus.zaehlerstaende (zaehler_id, ablesedatum);

create table wimus.zaehler_umrechnungen (
  id           uuid primary key default gen_random_uuid(),
  zaehler_id   uuid not null references wimus.zaehler(id) on delete cascade,
  faktor       decimal(12,6),                     -- z. B. m³ -> kWh
  gueltig_von  date,
  gueltig_bis  date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.custom_field_definitionen (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  bezug_typ       varchar(20) check (bezug_typ in ('objekt','einheit','kontakt','buchung','mietvertrag','vorgang')),
  feldname        varchar(100),
  feldschluessel  varchar(100),
  feldtyp         varchar(20) check (feldtyp in ('text','zahl','datum','bool','url','email','auswahl','textarea')),
  pflichtfeld     boolean not null default false,
  auswahl_optionen jsonb,
  reihenfolge     integer,
  gruppe          varchar(100),
  aktiv           boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.custom_field_werte (
  id            uuid primary key default gen_random_uuid(),
  definition_id uuid not null references wimus.custom_field_definitionen(id) on delete cascade,
  bezug_typ     varchar(20),
  bezug_id      uuid,                              -- polymorph
  wert          text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- GRUPPE 2 – VERTRÄGE, BUCHUNGEN, BANK
-- =====================================================================

create table wimus.bankkonten (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  bezeichnung     varchar(100),
  kontoinhaber    varchar(255),
  bank            varchar(255),
  iban            varchar(34),
  bic             varchar(20),
  kontotyp        varchar(50),
  finapi_account_id varchar(100),
  saldo_aktuell   decimal(15,2),
  ist_hauptkonto  boolean not null default false,
  aktiv           boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.mietvertraege (
  id                   uuid primary key default gen_random_uuid(),
  mandant_id           uuid not null references wimus.mandanten(id) on delete cascade,
  einheit_id           uuid references wimus.einheiten(id) on delete set null,
  mieter_id            uuid references wimus.kontakte(id) on delete set null,
  vertragstyp          varchar(10) check (vertragstyp in ('V01','V02','V03','V04')),
  mietbeginn           date,
  mietende             date,
  grundmiete           decimal(10,2),
  bk_pauschale         decimal(10,2),
  heizkosten_pauschale decimal(10,2),
  strompauschale       decimal(10,2),
  faelligkeitsregel    varchar(50),
  kdu_relevant         boolean not null default false,
  kuendigungsausschluss_bis date,
  widerrufs_frist      date,
  staffel_config       jsonb,
  aktenzeichen         varchar(50),
  paperless_id         varchar(100),
  status               varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.buchungen (
  id                  uuid primary key default gen_random_uuid(),
  mandant_id          uuid not null references wimus.mandanten(id) on delete cascade,
  einheit_id          uuid references wimus.einheiten(id) on delete set null,
  gast_id             uuid references wimus.kontakte(id) on delete set null,
  checkin             timestamptz,
  checkout            timestamptz,
  personen            integer,
  betrag_brutto       decimal(10,2),
  ust_prozent         decimal(5,2) default 7.00,
  kanal               varchar(100),
  beds24_id           varchar(100),
  apartment_pin       varchar(20),               -- TTLock, dynamisch je Buchung
  keybox_pin          varchar(20),               -- statisch aus einheiten.keybox_pin_statisch
  tuya_szene          varchar(100),
  gaestemappe_token   uuid default gen_random_uuid(),
  meldeschein_reisepass varchar(50),             -- DSGVO-Löschkonzept!
  citytax_betrag      decimal(10,2),
  status              varchar(30),
  aktenzeichen        varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.kautionen (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  mietvertrag_id  uuid references wimus.mietvertraege(id) on delete cascade,
  bankkonto_id    uuid references wimus.bankkonten(id) on delete set null,
  betrag          decimal(10,2),
  anlage_art      varchar(50),
  zinssatz        decimal(5,4),
  zinsen_kumuliert decimal(10,2),
  status          varchar(20),
  rueckzahlung_datum date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.mahnungen (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  mietvertrag_id  uuid references wimus.mietvertraege(id) on delete cascade,
  stufe           integer check (stufe between 1 and 5),
  hauptforderung  decimal(10,2),
  zinsen          decimal(10,2),
  gebuehren       decimal(10,2),
  gesamtforderung decimal(10,2),
  faellig_am      date,
  mahngericht_az  varchar(100),
  status          varchar(20),
  aktenzeichen    varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.mietanpassungen (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  mietvertrag_id  uuid references wimus.mietvertraege(id) on delete cascade,
  typ             varchar(20),                   -- §558/§559/Staffel/Index
  betrag          decimal(10,2),
  kappung_ausschoepfung decimal(5,2),
  status          varchar(20),
  naechste_erhoehung_moeglich date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.sepa_mandate (
  id             uuid primary key default gen_random_uuid(),
  mandant_id     uuid not null references wimus.mandanten(id) on delete cascade,
  kontakt_id     uuid references wimus.kontakte(id) on delete set null,
  bankkonto_id   uuid references wimus.bankkonten(id) on delete set null,
  mandatsreferenz varchar(100) unique,
  glaeubiger_id  varchar(100),
  mandatstyp     varchar(20) check (mandatstyp in ('einmalig','wiederkehrend')),
  ausgestellt_am date,
  widerruf_am    date,
  aktiv          boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.stornierungsbedingungen (
  id          uuid primary key default gen_random_uuid(),
  mandant_id  uuid not null references wimus.mandanten(id) on delete cascade,
  einheit_id  uuid references wimus.einheiten(id) on delete set null,
  name        varchar(255),
  frist_tage  integer,
  erstattung_pct decimal(5,2),
  beschreibung text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- OBJEKT-FINANZIERUNG / RECHT / PHASEN  (P01b/c/d)
-- =====================================================================

create table wimus.finanzierungen (
  id                  uuid primary key default gen_random_uuid(),
  mandant_id          uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id           uuid references wimus.objekte(id) on delete set null,
  gesellschaft_id     uuid references wimus.gesellschaften(id) on delete set null,
  glaeubiger          varchar(255),
  darlehen_nr         varchar(100),
  darlehensbetrag     decimal(15,2),
  valuta              decimal(15,2),
  zinssatz            decimal(6,3),
  tilgungssatz        decimal(6,3),
  zinsbindung_jahre   integer,
  zinsbindung_bis     date,
  bela_ist            decimal(15,2),
  bela_soll           decimal(15,2),
  ersatztilgung_typ   varchar(50),
  ersatztilgung_betrag decimal(15,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.grundbuch (
  id            uuid primary key default gen_random_uuid(),
  mandant_id    uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id     uuid references wimus.objekte(id) on delete cascade,
  abteilung     varchar(3) check (abteilung in ('I','II','III')),
  typ           varchar(100),
  rang          varchar(20),
  glaeubiger_id uuid references wimus.kontakte(id) on delete set null,
  betrag        decimal(15,2),
  zweckerklaerung_dok_id varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.objekt_phasen (
  id             uuid primary key default gen_random_uuid(),
  objekt_id      uuid not null references wimus.objekte(id) on delete cascade,
  bezeichnung    varchar(255),
  start          date,
  laufzeit_monate integer,
  einheiten_mix  jsonb,
  ertraege_pa    decimal(15,2),
  jre            decimal(15,2),
  guv            decimal(15,2),
  rendite        decimal(8,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- GRUPPE 4 – STEUER, AFA & SZENARIEN
-- =====================================================================

create table wimus.szenarien (
  id             uuid primary key default gen_random_uuid(),
  mandant_id     uuid not null references wimus.mandanten(id) on delete cascade,
  bezeichnung    varchar(255),
  typ            varchar(20) check (typ in ('afa','verkauf','entwicklung','finanzierung')),
  basis_objekt_id uuid references wimus.objekte(id) on delete set null,
  aktiv          boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.szenario_parameter (
  id             uuid primary key default gen_random_uuid(),
  szenario_id    uuid not null references wimus.szenarien(id) on delete cascade,
  parameter_name varchar(255),
  parameter_wert text,
  gilt_ab_jahr   integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.afa_stamm (
  id                    uuid primary key default gen_random_uuid(),
  objekt_id             uuid not null unique references wimus.objekte(id) on delete cascade,
  kaufpreis_gesamt      decimal(15,2),
  grundstuecksanteil_pct decimal(5,2),
  grundstuecksanteil_eur decimal(15,2),
  gebaeudeanteil_eur    decimal(15,2),
  afa_bemessungsgrundlage decimal(15,2),
  afa_satz_standard     decimal(5,4) default 0.02,
  afa_satz_optimiert    decimal(5,4),
  afa_satz_aktiv        decimal(5,4),
  rnd_gutachten         boolean not null default false,
  kpa_gutachten         boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.afa_buchungen (
  id               uuid primary key default gen_random_uuid(),
  objekt_id        uuid not null references wimus.objekte(id) on delete cascade,
  afa_stamm_id     uuid references wimus.afa_stamm(id) on delete set null,
  szenario_id      uuid references wimus.szenarien(id) on delete set null,
  wirtschaftsjahr  integer,
  afa_betrag       decimal(15,2),
  restbuchwert_anfang decimal(15,2),
  restbuchwert_ende decimal(15,2),
  ist_oder_plan    varchar(4) check (ist_oder_plan in ('IST','PLAN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.renovierungskosten (
  id                 uuid primary key default gen_random_uuid(),
  mandant_id         uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id          uuid references wimus.objekte(id) on delete cascade,
  massnahme          varchar(255),
  kosten_netto       decimal(10,2),
  leistungsdatum     date,
  rechnungsdatum     date,
  innerhalb_3j_frist boolean not null default false,
  zaehlt_zur_grenze  boolean not null default false,   -- 15%-Grenze §6
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.veraeusserungen (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id       uuid references wimus.objekte(id) on delete set null,
  gesellschaft_id uuid references wimus.gesellschaften(id) on delete set null,
  datum           date,
  preis           decimal(15,2),
  haltedauer_jahre decimal(5,2),
  steuerfrei_10j  boolean not null default false,
  paperless_id    varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.reinvestitionsruecklagen (
  id                    uuid primary key default gen_random_uuid(),
  gesellschaft_id       uuid not null references wimus.gesellschaften(id) on delete cascade,
  gebildet_aus_verkauf_id uuid references wimus.veraeusserungen(id) on delete set null,
  uebertragen_auf_objekt_id uuid references wimus.objekte(id) on delete set null,
  betrag                decimal(15,2),
  gebildet_am           date,
  frist_regulaer        date,                    -- 4 Jahre
  frist_neubau          date,                    -- 6 Jahre
  status                varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.intercompany (
  id                      uuid primary key default gen_random_uuid(),
  mandant_id              uuid not null references wimus.mandanten(id) on delete cascade,
  leistende_gesellschaft_id uuid references wimus.gesellschaften(id) on delete set null,
  empfangende_gesellschaft_id uuid references wimus.gesellschaften(id) on delete set null,
  leistungsdatum          date,
  rechnungsdatum          date,
  betrag                  decimal(15,2),
  leistungsart            text,
  fremdvergleich_ok       boolean not null default false,
  verzoegerungsgrund      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- GRUPPE 5 – VORGÄNGE, WORKFORCE, VERTRIEB
-- =====================================================================

create table wimus.vorgaenge (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id       uuid references wimus.objekte(id) on delete set null,
  einheit_id      uuid references wimus.einheiten(id) on delete set null,
  gemeldet_von    uuid references wimus.kontakte(id) on delete set null,
  handwerker_id   uuid references wimus.kontakte(id) on delete set null,
  typ             varchar(50),
  prioritaet      varchar(20) check (prioritaet in ('notfall','hoch','normal','niedrig')),
  status          varchar(30),
  kostentraeger   varchar(50),
  kosten_geschaetzt decimal(12,2),
  kosten_ist      decimal(12,2),
  leistungsdatum  date,
  aktenzeichen    varchar(50),                   -- AUTO via Trigger
  lfd_nr          integer,
  paperless_id    varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.prozess_bibliothek (
  id           uuid primary key default gen_random_uuid(),
  mandant_id   uuid not null references wimus.mandanten(id) on delete cascade,
  name         varchar(255) not null,
  beschreibung text,
  kategorie    varchar(100),
  trigger_typ  varchar(100),
  schritte     jsonb,
  ist_vorlage  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.ma_profile (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  kontakt_id      uuid references wimus.kontakte(id) on delete set null,
  typ             varchar(10) check (typ in ('intern','extern')),
  stundenlohn_brutto decimal(8,2),
  ag_sv_pct       decimal(5,2) default 21.00,
  urlaubstage     integer,
  bereich         varchar(100),
  qualifikationen jsonb,
  score_aktuell   integer,
  aktiv           boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.prozess_ausfuehrungen (
  id               uuid primary key default gen_random_uuid(),
  prozess_id       uuid not null references wimus.prozess_bibliothek(id) on delete cascade,
  vorgang_id       uuid references wimus.vorgaenge(id) on delete set null,
  ma_id            uuid references wimus.ma_profile(id) on delete set null,
  status           varchar(20),
  aktueller_schritt integer,
  gestartet_am     timestamptz,
  abgeschlossen_am timestamptz,
  daten            jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.ma_verfuegbarkeit (
  id               uuid primary key default gen_random_uuid(),
  ma_id            uuid not null references wimus.ma_profile(id) on delete cascade,
  wochentag        integer check (wochentag between 0 and 6),
  von_uhr          time,
  bis_uhr          time,
  max_stunden_woche decimal(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.objekt_zuweisungen (
  id          uuid primary key default gen_random_uuid(),
  objekt_id   uuid not null references wimus.objekte(id) on delete cascade,
  ma_id       uuid not null references wimus.ma_profile(id) on delete cascade,
  bereich     varchar(20) check (bereich in ('reinigung','hausmeister','handwerk')),
  rolle       varchar(20) check (rolle in ('primaer','vertretung','pool','ueberhang')),
  prioritaet  integer,
  gueltig_von date,
  gueltig_bis date,
  aktiv       boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.einsaetze (
  id                uuid primary key default gen_random_uuid(),
  mandant_id        uuid not null references wimus.mandanten(id) on delete cascade,
  vorgang_id        uuid references wimus.vorgaenge(id) on delete set null,
  ma_id             uuid references wimus.ma_profile(id) on delete set null,
  geplant_start     timestamptz,
  geplant_ende      timestamptz,
  ist_start         timestamptz,
  ist_ende          timestamptz,
  zeitvorgabe_ki_min integer,
  status            varchar(20),
  score_beitrag     integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.auftrag_zuweisungen (
  id                    uuid primary key default gen_random_uuid(),
  vorgang_id            uuid not null references wimus.vorgaenge(id) on delete cascade,
  ma_id                 uuid references wimus.ma_profile(id) on delete set null,
  zugewiesen_automatisch boolean not null default false,
  grund                 varchar(20) check (grund in ('primaer','vertretung','kapazitaet','manuell')),
  ueberschrieben_von    uuid references wimus.benutzer(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.checklisten_vorlagen (
  id            uuid primary key default gen_random_uuid(),
  mandant_id    uuid not null references wimus.mandanten(id) on delete cascade,
  name          varchar(255) not null,
  gilt_fuer_typ varchar(50),
  sprache       varchar(5) default 'de',
  aktiv         boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.checklisten_positionen (
  id               uuid primary key default gen_random_uuid(),
  vorlage_id       uuid not null references wimus.checklisten_vorlagen(id) on delete cascade,
  block_nr         integer,
  position_nr      integer,
  bezeichnung      varchar(255),
  typ              varchar(20) check (typ in ('foto_ki','foto','checkbox','text','zahl','sprache')),
  haeufigkeit      varchar(20) check (haeufigkeit in ('immer','turnus','buchungen')),
  turnus_tage      integer,
  vorgabe_foto_url varchar(500),
  ki_kriterien     text,
  ki_schwellenwert decimal(4,2) default 0.75,
  max_versuche     integer default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.checklisten_ausfuehrungen (
  id          uuid primary key default gen_random_uuid(),
  vorlage_id  uuid not null references wimus.checklisten_vorlagen(id) on delete cascade,
  vorgang_id  uuid references wimus.vorgaenge(id) on delete set null,
  ma_id       uuid references wimus.ma_profile(id) on delete set null,
  objekt_id   uuid references wimus.objekte(id) on delete set null,
  einheit_id  uuid references wimus.einheiten(id) on delete set null,
  beginn      timestamptz,
  ende        timestamptz,
  status      varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.checklisten_ergebnisse (
  id            uuid primary key default gen_random_uuid(),
  ausfuehrung_id uuid not null references wimus.checklisten_ausfuehrungen(id) on delete cascade,
  position_id   uuid references wimus.checklisten_positionen(id) on delete set null,
  versuche      jsonb,
  endstatus     varchar(20),
  dauer_sek     integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.pipelines (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  name       varchar(255) not null,
  bereich    varchar(50),
  modus      varchar(10) check (modus in ('auto','manuell','hybrid')),
  aktiv      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.pipeline_phasen (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references wimus.pipelines(id) on delete cascade,
  name        varchar(255) not null,
  reihenfolge integer,
  farbe       varchar(7),
  verweildauer_warnung_tage integer,
  pflichtaktionen jsonb,
  n8n_webhook_id varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.vertriebspartner (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  name            varchar(255) not null,
  typ             varchar(30) check (typ in ('makler','tippgeber','portal','strukturvertrieb')),
  paragraph_34c_nr varchar(100),
  iban            varchar(34),
  ust_id          varchar(50),
  bewertung       decimal(4,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.deals (
  id               uuid primary key default gen_random_uuid(),
  mandant_id       uuid not null references wimus.mandanten(id) on delete cascade,
  pipeline_id      uuid references wimus.pipelines(id) on delete set null,
  phase_id         uuid references wimus.pipeline_phasen(id) on delete set null,
  kontakt_id       uuid references wimus.kontakte(id) on delete set null,
  einheit_id       uuid references wimus.einheiten(id) on delete set null,
  objekt_id        uuid references wimus.objekte(id) on delete set null,
  buchung_id       uuid references wimus.buchungen(id) on delete set null,  -- KZV Auto-Pipeline
  kanal            varchar(100),
  wert             decimal(15,2),
  zustaendig_id    uuid references wimus.benutzer(id) on delete set null,
  verlauf          jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.maklervertraege (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  partner_id      uuid references wimus.vertriebspartner(id) on delete set null,
  objekt_id       uuid references wimus.objekte(id) on delete set null,
  auftragstyp     varchar(20) check (auftragstyp in ('allein','qualifiziert','einfach')),
  laufzeit_von    date,
  laufzeit_bis    date,
  provision_pct   decimal(6,3),
  provisionsbasis varchar(100),
  erfolgsbedingung text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.expose_varianten (
  id          uuid primary key default gen_random_uuid(),
  mandant_id  uuid not null references wimus.mandanten(id) on delete cascade,
  einheit_id  uuid references wimus.einheiten(id) on delete set null,
  kanal       varchar(100),
  titel       varchar(255),
  beschreibung text,
  ausstattung jsonb,
  status      varchar(20),
  aufrufe     integer not null default 0,
  anfragen    integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.interessenten (
  id          uuid primary key default gen_random_uuid(),
  mandant_id  uuid not null references wimus.mandanten(id) on delete cascade,
  kontakt_id  uuid references wimus.kontakte(id) on delete set null,
  einheit_id  uuid references wimus.einheiten(id) on delete set null,
  kanal       varchar(100),
  erstkontakt date,
  status      varchar(30),
  absagegrund text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.besichtigungen (
  id             uuid primary key default gen_random_uuid(),
  interessent_id uuid not null references wimus.interessenten(id) on delete cascade,
  datum          timestamptz,
  ergebnis       text,
  notizen        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.provisionen (
  id            uuid primary key default gen_random_uuid(),
  mandant_id    uuid not null references wimus.mandanten(id) on delete cascade,
  partner_id    uuid references wimus.vertriebspartner(id) on delete set null,
  referenz_typ  varchar(20) check (referenz_typ in ('deal','mietvertrag','buchung','verkauf')),
  referenz_id   uuid,                              -- polymorph
  betrag        decimal(10,2),
  faelligkeit   date,
  status        varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- QUERSCHNITT / WEITERE
-- =====================================================================

create table wimus.nachrichten (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  kontakt_id uuid references wimus.kontakte(id) on delete set null,
  vorgang_id uuid references wimus.vorgaenge(id) on delete set null,
  kanal      varchar(20),
  richtung   varchar(3) check (richtung in ('ein','aus')),
  betreff    varchar(500),
  inhalt     text,
  status     varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.vorlagen (
  id        uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  kategorie varchar(30) check (kategorie in ('abmahnung','kuendigung','mahnung','schriftverkehr')),
  name      varchar(255) not null,
  inhalt_mit_variablen text,
  typ       varchar(10) check (typ in ('PDF','Email','Brief')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.filter_profile (
  id           uuid primary key default gen_random_uuid(),
  benutzer_id  uuid not null references wimus.benutzer(id) on delete cascade,
  bezeichnung  varchar(255),
  bereich      varchar(50),
  filter_config jsonb,
  ist_standard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.geraete (
  id              uuid primary key default gen_random_uuid(),
  mandant_id      uuid not null references wimus.mandanten(id) on delete cascade,
  typ             varchar(20) check (typ in ('werkzeug','lager','fahrzeug','moebel')),
  qr_code         varchar(100),
  bezeichnung     varchar(255),
  zustand         varchar(50),
  standort_typ    varchar(20),                    -- polymorph
  standort_ref_id uuid,
  anschaffungsdatum date,
  anschaffungswert decimal(15,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.wartungsintervalle (
  id                 uuid primary key default gen_random_uuid(),
  mandant_id         uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id          uuid references wimus.objekte(id) on delete cascade,
  typ                varchar(100),
  intervall_monate   integer,
  letzte_durchfuehrung date,
  naechste_faelligkeit date,
  status             varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.versicherungen (
  id           uuid primary key default gen_random_uuid(),
  mandant_id   uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id    uuid references wimus.objekte(id) on delete set null,
  typ          varchar(100),
  versicherer  varchar(255),
  police_nr    varchar(100),
  jahrespraemie decimal(12,2),
  deckungssumme decimal(15,2),
  ablaufdatum  date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.bewertungen (
  id            uuid primary key default gen_random_uuid(),
  mandant_id    uuid not null references wimus.mandanten(id) on delete cascade,
  einheit_id    uuid references wimus.einheiten(id) on delete set null,
  buchung_id    uuid references wimus.buchungen(id) on delete set null,
  plattform     varchar(50),
  score         decimal(4,2),
  text          text,
  antwort       text,
  antwort_status varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.incident_reports (
  id            uuid primary key default gen_random_uuid(),
  mandant_id    uuid not null references wimus.mandanten(id) on delete cascade,
  vorgang_id    uuid references wimus.vorgaenge(id) on delete set null,
  buchung_id    uuid references wimus.buchungen(id) on delete set null,
  typ           varchar(100),
  kosten        decimal(12,2),
  kostentraeger varchar(50),
  fotos         jsonb,
  status        varchar(20),
  airbnb_case_id varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.citytax_buchungen (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  buchung_id uuid references wimus.buchungen(id) on delete set null,
  betrag     decimal(10,2),
  personen   integer,
  naechte    integer,
  gemeinde   varchar(100),
  quartal    varchar(10),
  exportiert boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wimus.entmietungen (
  id         uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references wimus.mandanten(id) on delete cascade,
  objekt_id  uuid references wimus.objekte(id) on delete set null,
  mieter_id  uuid references wimus.kontakte(id) on delete set null,
  strategie  varchar(10) check (strategie in ('sanft','hart')),
  abloese    decimal(15,2),
  break_even decimal(15,2),
  status     varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- RLS-HILFSFUNKTION (nach benutzer_rollen definiert)
-- =====================================================================
create or replace function wimus.user_mandanten()
returns setof uuid
language sql stable security definer
set search_path = wimus, public, pg_temp
as $$
  select br.mandant_id
  from wimus.benutzer_rollen br
  where br.benutzer_id = auth.uid()
    and (br.gueltig_von is null or br.gueltig_von <= now())
    and (br.gueltig_bis is null or br.gueltig_bis >= now());
$$;

-- =====================================================================
-- AKTENZEICHEN-TRIGGER (vorgaenge)
-- Format: YYYY + mandant.kuerzel + objekt.kuerzel + einheit.kuerzel + LfdNr(2)
-- =====================================================================
create or replace function wimus.generate_aktenzeichen()
returns trigger language plpgsql as $$
declare
  v_mk text; v_ok text; v_ek text; v_lfd integer; v_jahr text;
begin
  if new.aktenzeichen is not null then
    return new;
  end if;
  v_jahr := extract(year from now())::text;
  select coalesce(kuerzel,'') into v_mk from wimus.mandanten where id = new.mandant_id;
  select coalesce(kuerzel,'') into v_ok from wimus.objekte   where id = new.objekt_id;
  select coalesce(kuerzel,'') into v_ek from wimus.einheiten where id = new.einheit_id;

  -- laufende Nummer je Objekt/Jahr
  select coalesce(max(lfd_nr),0)+1 into v_lfd
  from wimus.vorgaenge
  where objekt_id is not distinct from new.objekt_id
    and extract(year from created_at) = extract(year from now());

  new.lfd_nr := v_lfd;
  new.aktenzeichen := v_jahr || v_mk || v_ok || v_ek || lpad(v_lfd::text, 2, '0');
  return new;
end;
$$;

create trigger trg_aktenzeichen
  before insert on wimus.vorgaenge
  for each row execute function wimus.generate_aktenzeichen();

-- =====================================================================
-- INDIZES auf allen FK-Spalten (DB-getrieben -> vollständig)
-- =====================================================================
do $$
declare r record;
begin
  for r in
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'wimus'
  loop
    execute format('create index if not exists idx_%s_%s on wimus.%I (%I);',
                   r.table_name, r.column_name, r.table_name, r.column_name);
  end loop;
end $$;

-- =====================================================================
-- updated_at-Trigger auf allen Tabellen
-- =====================================================================
do $$
declare r record;
begin
  for r in
    select table_name from information_schema.columns
    where table_schema = 'wimus' and column_name = 'updated_at'
  loop
    execute format('drop trigger if exists trg_set_updated_at on wimus.%I;', r.table_name);
    execute format('create trigger trg_set_updated_at before update on wimus.%I
                      for each row execute function wimus.set_updated_at();', r.table_name);
  end loop;
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY  (service_role umgeht RLS -> serverseitige API frei)
-- =====================================================================

-- (1) Tabellen MIT eigener mandant_id
do $$
declare
  t text;
  tabs text[] := array[
    'gesellschaften','kontakte','kommunikationskanaele','objekte','objekt_emails',
    'zertifikate_lizenzen','ausstattungs_kategorien','versorgervertraege','zaehler',
    'custom_field_definitionen','bankkonten','mietvertraege','buchungen','kautionen',
    'mahnungen','mietanpassungen','sepa_mandate','stornierungsbedingungen',
    'finanzierungen','grundbuch','szenarien','renovierungskosten','veraeusserungen',
    'intercompany','vorgaenge','prozess_bibliothek','ma_profile','einsaetze',
    'checklisten_vorlagen','pipelines','vertriebspartner','deals','maklervertraege',
    'expose_varianten','interessenten','provisionen','nachrichten','vorlagen',
    'geraete','wartungsintervalle','versicherungen','bewertungen','incident_reports',
    'citytax_buchungen','entmietungen'
  ];
begin
  foreach t in array tabs loop
    execute format('alter table wimus.%I enable row level security;', t);
    execute format('drop policy if exists mandant_isolation on wimus.%I;', t);
    execute format('create policy mandant_isolation on wimus.%I for all to authenticated
      using (mandant_id in (select wimus.user_mandanten()))
      with check (mandant_id in (select wimus.user_mandanten()));', t);
  end loop;
end $$;

-- (2) Kindtabellen OHNE mandant_id -> Isolation über Elterntabelle (Eltern hat mandant_id)
do $$
declare
  spec text; p text[];
  specs text[] := array[
    'einheiten|objekt_id|objekte',
    'objekt_phasen|objekt_id|objekte',
    'afa_stamm|objekt_id|objekte',
    'afa_buchungen|objekt_id|objekte',
    'ausstattungen|kategorie_id|ausstattungs_kategorien',
    'szenario_parameter|szenario_id|szenarien',
    'reinvestitionsruecklagen|gesellschaft_id|gesellschaften',
    'pipeline_phasen|pipeline_id|pipelines',
    'besichtigungen|interessent_id|interessenten',
    'ma_verfuegbarkeit|ma_id|ma_profile',
    'objekt_zuweisungen|objekt_id|objekte',
    'auftrag_zuweisungen|vorgang_id|vorgaenge',
    'prozess_ausfuehrungen|prozess_id|prozess_bibliothek',
    'checklisten_positionen|vorlage_id|checklisten_vorlagen',
    'checklisten_ausfuehrungen|vorlage_id|checklisten_vorlagen',
    'zaehlerstaende|zaehler_id|zaehler',
    'zaehler_umrechnungen|zaehler_id|zaehler'
  ];
begin
  foreach spec in array specs loop
    p := string_to_array(spec, '|');
    execute format('alter table wimus.%I enable row level security;', p[1]);
    execute format('drop policy if exists mandant_isolation on wimus.%I;', p[1]);
    execute format('create policy mandant_isolation on wimus.%I for all to authenticated
      using (exists (select 1 from wimus.%I parent where parent.id = wimus.%I.%I
                     and parent.mandant_id in (select wimus.user_mandanten())))
      with check (exists (select 1 from wimus.%I parent where parent.id = wimus.%I.%I
                     and parent.mandant_id in (select wimus.user_mandanten())));',
      p[1], p[3], p[1], p[2], p[3], p[1], p[2]);
  end loop;
end $$;

-- (2b) Enkeltabellen: einheit_* -> einheiten -> objekte (einheiten hat KEINE eigene mandant_id)
do $$
declare
  t text;
  tabs text[] := array[
    'einheit_ausstattungen','einheit_hausregeln','gaestemappe_inhalte',
    'einheit_sicherheit','einheit_bettenstruktur','einheit_fotos','einheit_pois'
  ];
begin
  foreach t in array tabs loop
    execute format('alter table wimus.%I enable row level security;', t);
    execute format('drop policy if exists mandant_isolation on wimus.%I;', t);
    execute format('create policy mandant_isolation on wimus.%I for all to authenticated
      using (exists (select 1 from wimus.einheiten e
                     join wimus.objekte o on o.id = e.objekt_id
                     where e.id = wimus.%I.einheit_id
                       and o.mandant_id in (select wimus.user_mandanten())))
      with check (exists (select 1 from wimus.einheiten e
                     join wimus.objekte o on o.id = e.objekt_id
                     where e.id = wimus.%I.einheit_id
                       and o.mandant_id in (select wimus.user_mandanten())));',
      t, t, t);
  end loop;
end $$;

-- (3) Spezialfälle
-- einheiten-zwei-Ebenen: checklisten_ergebnisse / custom_field_werte je nach Elternkette
alter table wimus.checklisten_ergebnisse enable row level security;
drop policy if exists mandant_isolation on wimus.checklisten_ergebnisse;
create policy mandant_isolation on wimus.checklisten_ergebnisse for all to authenticated
  using (exists (select 1 from wimus.checklisten_ausfuehrungen a
                 join wimus.checklisten_vorlagen v on v.id = a.vorlage_id
                 where a.id = wimus.checklisten_ergebnisse.ausfuehrung_id
                   and v.mandant_id in (select wimus.user_mandanten())))
  with check (exists (select 1 from wimus.checklisten_ausfuehrungen a
                 join wimus.checklisten_vorlagen v on v.id = a.vorlage_id
                 where a.id = wimus.checklisten_ergebnisse.ausfuehrung_id
                   and v.mandant_id in (select wimus.user_mandanten())));

alter table wimus.custom_field_werte enable row level security;
drop policy if exists mandant_isolation on wimus.custom_field_werte;
create policy mandant_isolation on wimus.custom_field_werte for all to authenticated
  using (exists (select 1 from wimus.custom_field_definitionen d
                 where d.id = wimus.custom_field_werte.definition_id
                   and d.mandant_id in (select wimus.user_mandanten())))
  with check (exists (select 1 from wimus.custom_field_definitionen d
                 where d.id = wimus.custom_field_werte.definition_id
                   and d.mandant_id in (select wimus.user_mandanten())));

-- mandanten / benutzer / benutzer_rollen / filter_profile / rollen
alter table wimus.mandanten enable row level security;
drop policy if exists mandant_isolation on wimus.mandanten;
create policy mandant_isolation on wimus.mandanten for all to authenticated
  using (id in (select wimus.user_mandanten()))
  with check (id in (select wimus.user_mandanten()));

alter table wimus.benutzer enable row level security;
drop policy if exists self_access on wimus.benutzer;
create policy self_access on wimus.benutzer for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

alter table wimus.benutzer_rollen enable row level security;
drop policy if exists self_access on wimus.benutzer_rollen;
create policy self_access on wimus.benutzer_rollen for all to authenticated
  using (benutzer_id = auth.uid()) with check (benutzer_id = auth.uid());

alter table wimus.filter_profile enable row level security;
drop policy if exists self_access on wimus.filter_profile;
create policy self_access on wimus.filter_profile for all to authenticated
  using (benutzer_id = auth.uid()) with check (benutzer_id = auth.uid());

alter table wimus.rollen enable row level security;
drop policy if exists rollen_lesen on wimus.rollen;
create policy rollen_lesen on wimus.rollen for select to authenticated using (true);

-- =====================================================================
-- GRANTS
-- =====================================================================
grant usage on schema wimus to authenticated, service_role, anon;
grant all on all tables in schema wimus to authenticated, service_role;
grant all on all sequences in schema wimus to authenticated, service_role;
grant execute on all functions in schema wimus to authenticated, service_role;
alter default privileges in schema wimus grant all on tables to authenticated, service_role;
alter default privileges in schema wimus grant all on sequences to authenticated, service_role;

-- =====================================================================
-- SEED: 12 Standard-Rollen (Kap. 5.7 / 6.1)
-- =====================================================================
insert into wimus.rollen (name, typ, beschreibung) values
  ('superadmin',        'system',  'Alles, alle Mandanten, Systemeinstellungen'),
  ('steuerberater',     'system',  'Lesezugriff Finanzen/Belege, alle Mandanten, KEINE Mieterdaten'),
  ('mandant_admin',     'mandant', 'Alles innerhalb des Mandanten'),
  ('verwalter',         'mandant', 'Objekte, Verträge, Vorgänge, Kommunikation – KEINE Finanzen/Bank'),
  ('buchhalter',        'mandant', 'Finanzen, DATEV-Export, Rechnungen – KEINE Mieter-Kommunikation'),
  ('hausmeister',       'mandant', 'Nur Vorgänge eigener Objekte, Plantafel – KEINE Stammdaten'),
  ('reinigungskraft',   'mandant', 'Nur Buchungen/Checklisten, Fotos hochladen – KEINE Kontaktdaten'),
  ('aussendienst',      'mandant', 'Besichtigungen, Interessenten, Exposés, Pipeline – KEINE Finanzen'),
  ('lesezugriff',       'mandant', 'Nur lesen, nichts schreiben'),
  ('eigentuemer_portal','extern',  'Nur eigene Objekte, Berichte, Dokumente'),
  ('mieter_portal',     'extern',  'Nur eigene Einheit, Schadensmeldung, Dokumente'),
  ('gast_portal',       'extern',  'Nur eigene Buchung, Code, Hausregeln, Support')
on conflict (name) do nothing;
