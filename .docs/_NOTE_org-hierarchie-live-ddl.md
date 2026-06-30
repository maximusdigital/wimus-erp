# Org-Hierarchie — Live-DDL (Roh-Extraktion, Phase A #21)

> READ-ONLY aus dem Live-Schema `wimus` via /pg/query (postgres-meta). Roh, nicht interpretiert.
> Extrahiert: 2026-06-30 (System-UTC) · Tabellen: workspaces, firmen, projekte.

## 1. Spalten (information_schema.columns)

```json
[
  {
    "table_name": "firmen",
    "ordinal_position": 1,
    "column_name": "id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "firmen",
    "ordinal_position": 2,
    "column_name": "workspace_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 3,
    "column_name": "mutter_firma_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 4,
    "column_name": "name",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 5,
    "column_name": "kuerzel",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 10,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 6,
    "column_name": "rechtsform",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 7,
    "column_name": "typ",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 8,
    "column_name": "geschaeftsfuehrer",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 9,
    "column_name": "prokuristen",
    "data_type": "text",
    "udt_name": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 10,
    "column_name": "handelsregister_nr",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 11,
    "column_name": "handelsregister_gericht",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 12,
    "column_name": "gruendungsdatum",
    "data_type": "date",
    "udt_name": "date",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 13,
    "column_name": "stammkapital",
    "data_type": "numeric",
    "udt_name": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 2,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 14,
    "column_name": "beteiligung_pct",
    "data_type": "numeric",
    "udt_name": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 5,
    "numeric_scale": 2,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 15,
    "column_name": "steuernummer",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 16,
    "column_name": "ust_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 17,
    "column_name": "steueramt",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 18,
    "column_name": "wirtschaftsjahr_start",
    "data_type": "integer",
    "udt_name": "int4",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "is_nullable": "YES",
    "column_default": "1"
  },
  {
    "table_name": "firmen",
    "ordinal_position": 19,
    "column_name": "umsatzsteuer_typ",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 20,
    "column_name": "umsatzsteuer_period",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 21,
    "column_name": "datev_berater_nr",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 22,
    "column_name": "datev_mandant_nr",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 23,
    "column_name": "bank_name",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 24,
    "column_name": "iban",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 25,
    "column_name": "bic",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 26,
    "column_name": "kontoinhaber",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 27,
    "column_name": "strasse",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 28,
    "column_name": "hausnummer",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 29,
    "column_name": "plz",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 10,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 30,
    "column_name": "stadt",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 31,
    "column_name": "stadtteil",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 32,
    "column_name": "land",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "'DE'::character varying"
  },
  {
    "table_name": "firmen",
    "ordinal_position": 33,
    "column_name": "telefon",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 34,
    "column_name": "telefon_2",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 35,
    "column_name": "fax",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 36,
    "column_name": "email",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 37,
    "column_name": "website",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 38,
    "column_name": "logo_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 39,
    "column_name": "logo_dunkel_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 40,
    "column_name": "ci_farbe_primary",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 7,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 41,
    "column_name": "ci_farbe_secondary",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 7,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 42,
    "column_name": "impressum_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 43,
    "column_name": "datenschutz_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 44,
    "column_name": "aktiv",
    "data_type": "boolean",
    "udt_name": "bool",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "firmen",
    "ordinal_position": 45,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "firmen",
    "ordinal_position": 46,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "firmen",
    "ordinal_position": 47,
    "column_name": "rechtsform_typ",
    "data_type": "text",
    "udt_name": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 48,
    "column_name": "besteuerungsart",
    "data_type": "text",
    "udt_name": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "firmen",
    "ordinal_position": 49,
    "column_name": "kontenrahmen_ref",
    "data_type": "text",
    "udt_name": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 1,
    "column_name": "id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 2,
    "column_name": "workspace_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 3,
    "column_name": "firma_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 4,
    "column_name": "parent_projekt_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 5,
    "column_name": "ebene",
    "data_type": "integer",
    "udt_name": "int4",
    "character_maximum_length": null,
    "numeric_precision": 32,
    "numeric_scale": 0,
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 6,
    "column_name": "pfad",
    "data_type": "text",
    "udt_name": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 7,
    "column_name": "kuerzel",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 8,
    "column_name": "name",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 9,
    "column_name": "typ",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 30,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 10,
    "column_name": "status",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "'aktiv'::character varying"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 11,
    "column_name": "start_datum",
    "data_type": "date",
    "udt_name": "date",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 12,
    "column_name": "end_datum",
    "data_type": "date",
    "udt_name": "date",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 13,
    "column_name": "budget",
    "data_type": "numeric",
    "udt_name": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 15,
    "numeric_scale": 2,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 14,
    "column_name": "projektmanager_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 15,
    "column_name": "marke",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 16,
    "column_name": "logo_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 17,
    "column_name": "logo_dunkel_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 18,
    "column_name": "ci_farbe_primary",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 7,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 19,
    "column_name": "ci_farbe_secondary",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 7,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 20,
    "column_name": "domain",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 21,
    "column_name": "email",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 22,
    "column_name": "telefon",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 23,
    "column_name": "whatsapp",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 24,
    "column_name": "website",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 25,
    "column_name": "instagram_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 26,
    "column_name": "google_profil_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 27,
    "column_name": "gaestemappe_domain",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 28,
    "column_name": "impressum_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 29,
    "column_name": "datenschutz_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 30,
    "column_name": "beds24_property_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 31,
    "column_name": "beds24_api_key",
    "data_type": "text",
    "udt_name": "text",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 32,
    "column_name": "pricelabs_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 33,
    "column_name": "airbnb_user_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 34,
    "column_name": "booking_property_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 35,
    "column_name": "retell_agent_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 36,
    "column_name": "ttlock_gateway_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 37,
    "column_name": "tuya_scene_prefix",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 38,
    "column_name": "citytax_pflichtig",
    "data_type": "boolean",
    "udt_name": "bool",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 39,
    "column_name": "citytax_gemeinde",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 40,
    "column_name": "citytax_satz",
    "data_type": "numeric",
    "udt_name": "numeric",
    "character_maximum_length": null,
    "numeric_precision": 4,
    "numeric_scale": 2,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 41,
    "column_name": "meldeschein_pflichtig",
    "data_type": "boolean",
    "udt_name": "bool",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 42,
    "column_name": "meldeschein_behoerde",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 43,
    "column_name": "ci_config",
    "data_type": "jsonb",
    "udt_name": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 44,
    "column_name": "kpi_config",
    "data_type": "jsonb",
    "udt_name": "jsonb",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "projekte",
    "ordinal_position": 45,
    "column_name": "aktiv",
    "data_type": "boolean",
    "udt_name": "bool",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 46,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "projekte",
    "ordinal_position": 47,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 1,
    "column_name": "id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 2,
    "column_name": "kuerzel",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 10,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 3,
    "column_name": "name",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 4,
    "column_name": "inhaber",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 5,
    "column_name": "strasse",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 6,
    "column_name": "hausnummer",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 20,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 7,
    "column_name": "plz",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 10,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 8,
    "column_name": "stadt",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 100,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 9,
    "column_name": "land",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "'DE'::character varying"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 10,
    "column_name": "telefon",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 50,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 11,
    "column_name": "email",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 12,
    "column_name": "website",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 255,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 13,
    "column_name": "logo_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 14,
    "column_name": "logo_dunkel_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 500,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 15,
    "column_name": "ci_farbe_primary",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 7,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "'1F4E5F'::character varying"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 16,
    "column_name": "ci_farbe_secondary",
    "data_type": "character varying",
    "udt_name": "varchar",
    "character_maximum_length": 7,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "'2E75B6'::character varying"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 17,
    "column_name": "aktiv",
    "data_type": "boolean",
    "udt_name": "bool",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 18,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "workspaces",
    "ordinal_position": 19,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "character_maximum_length": null,
    "numeric_precision": null,
    "numeric_scale": null,
    "is_nullable": "YES",
    "column_default": "now()"
  }
]
```


## 2. Constraints (PK/FK/UNIQUE/CHECK)

```json
[
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24571_1_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "id IS NOT NULL"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24571_4_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "name IS NOT NULL"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24571_2_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "workspace_id IS NOT NULL"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "firmen_besteuerungsart_check",
    "column_name": null,
    "foreign_table": "firmen",
    "foreign_column": "besteuerungsart",
    "check_clause": "(((besteuerungsart IS NULL) OR (besteuerungsart = ANY (ARRAY['bilanz'::text, 'euer'::text, 'ueberschuss'::text]))))"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "firmen_rechtsform_typ_check",
    "column_name": null,
    "foreign_table": "firmen",
    "foreign_column": "rechtsform_typ",
    "check_clause": "(((rechtsform_typ IS NULL) OR (rechtsform_typ = ANY (ARRAY['kapitalgesellschaft'::text, 'personengesellschaft'::text, 'privat'::text]))))"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "firmen_typ_check",
    "column_name": null,
    "foreign_table": "firmen",
    "foreign_column": "typ",
    "check_clause": "(((typ)::text = ANY ((ARRAY['privat'::character varying, 'operativ'::character varying, 'vvGmbH'::character varying, 'GbR'::character varying, 'holding'::character varying, 'sonstige'::character varying])::text[])))"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "firmen_umsatzsteuer_period_check",
    "column_name": null,
    "foreign_table": "firmen",
    "foreign_column": "umsatzsteuer_period",
    "check_clause": "(((umsatzsteuer_period)::text = ANY ((ARRAY['monatlich'::character varying, 'quartalsweise'::character varying, 'jaehrlich'::character varying])::text[])))"
  },
  {
    "table_name": "firmen",
    "constraint_type": "CHECK",
    "constraint_name": "firmen_umsatzsteuer_typ_check",
    "column_name": null,
    "foreign_table": "firmen",
    "foreign_column": "umsatzsteuer_typ",
    "check_clause": "(((umsatzsteuer_typ)::text = ANY ((ARRAY['regelbesteuerung'::character varying, 'kleinunternehmer'::character varying, 'istversteuerung'::character varying, 'sollversteuerung'::character varying])::text[])))"
  },
  {
    "table_name": "firmen",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "firmen_mutter_firma_id_fkey",
    "column_name": "mutter_firma_id",
    "foreign_table": "firmen",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "firmen",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "firmen_workspace_id_fkey",
    "column_name": "workspace_id",
    "foreign_table": "workspaces",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "firmen",
    "constraint_type": "PRIMARY KEY",
    "constraint_name": "firmen_pkey",
    "column_name": "id",
    "foreign_table": "firmen",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "projekte",
    "constraint_type": "CHECK",
    "constraint_name": "projekte_typ_check",
    "column_name": null,
    "foreign_table": "projekte",
    "foreign_column": "typ",
    "check_clause": "(((typ)::text = ANY ((ARRAY['kzv'::character varying, 'monteur'::character varying, 'wg'::character varying, 'hausverwaltung'::character varying, 'development'::character varying, 'ankauf'::character varying, 'bauprojekt'::character varying, 'r2r'::character varying, 'sonstige'::character varying])::text[])))"
  },
  {
    "table_name": "projekte",
    "constraint_type": "CHECK",
    "constraint_name": "projekte_status_check",
    "column_name": null,
    "foreign_table": "projekte",
    "foreign_column": "status",
    "check_clause": "(((status)::text = ANY ((ARRAY['planung'::character varying, 'aktiv'::character varying, 'abgeschlossen'::character varying, 'pausiert'::character varying])::text[])))"
  },
  {
    "table_name": "projekte",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24597_1_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "id IS NOT NULL"
  },
  {
    "table_name": "projekte",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24597_2_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "workspace_id IS NOT NULL"
  },
  {
    "table_name": "projekte",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24597_7_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "kuerzel IS NOT NULL"
  },
  {
    "table_name": "projekte",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24597_8_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "name IS NOT NULL"
  },
  {
    "table_name": "projekte",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "projekte_parent_projekt_id_fkey",
    "column_name": "parent_projekt_id",
    "foreign_table": "projekte",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "projekte",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "projekte_workspace_id_fkey",
    "column_name": "workspace_id",
    "foreign_table": "workspaces",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "projekte",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "projekte_firma_id_fkey",
    "column_name": "firma_id",
    "foreign_table": "firmen",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "projekte",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "fk_projekte_projektmanager",
    "column_name": "projektmanager_id",
    "foreign_table": "akteure",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "projekte",
    "constraint_type": "PRIMARY KEY",
    "constraint_name": "projekte_pkey",
    "column_name": "id",
    "foreign_table": "projekte",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "workspaces",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24555_2_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "kuerzel IS NOT NULL"
  },
  {
    "table_name": "workspaces",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24555_3_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "name IS NOT NULL"
  },
  {
    "table_name": "workspaces",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24555_1_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "id IS NOT NULL"
  },
  {
    "table_name": "workspaces",
    "constraint_type": "PRIMARY KEY",
    "constraint_name": "workspaces_pkey",
    "column_name": "id",
    "foreign_table": "workspaces",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "workspaces",
    "constraint_type": "UNIQUE",
    "constraint_name": "workspaces_kuerzel_key",
    "column_name": "kuerzel",
    "foreign_table": "workspaces",
    "foreign_column": "kuerzel",
    "check_clause": null
  }
]
```


## 3. Indizes (pg_indexes)

```json
[
  {
    "tablename": "firmen",
    "indexname": "firmen_pkey",
    "indexdef": "CREATE UNIQUE INDEX firmen_pkey ON wimus.firmen USING btree (id)"
  },
  {
    "tablename": "projekte",
    "indexname": "idx_projekte_firma",
    "indexdef": "CREATE INDEX idx_projekte_firma ON wimus.projekte USING btree (firma_id)"
  },
  {
    "tablename": "projekte",
    "indexname": "idx_projekte_parent",
    "indexdef": "CREATE INDEX idx_projekte_parent ON wimus.projekte USING btree (parent_projekt_id)"
  },
  {
    "tablename": "projekte",
    "indexname": "idx_projekte_workspace",
    "indexdef": "CREATE INDEX idx_projekte_workspace ON wimus.projekte USING btree (workspace_id)"
  },
  {
    "tablename": "projekte",
    "indexname": "projekte_pkey",
    "indexdef": "CREATE UNIQUE INDEX projekte_pkey ON wimus.projekte USING btree (id)"
  },
  {
    "tablename": "workspaces",
    "indexname": "workspaces_kuerzel_key",
    "indexdef": "CREATE UNIQUE INDEX workspaces_kuerzel_key ON wimus.workspaces USING btree (kuerzel)"
  },
  {
    "tablename": "workspaces",
    "indexname": "workspaces_pkey",
    "indexdef": "CREATE UNIQUE INDEX workspaces_pkey ON wimus.workspaces USING btree (id)"
  }
]
```


## 4. RLS-Policies (pg_policies)

```json
[
  {
    "tablename": "firmen",
    "policyname": "p_org_read",
    "cmd": "SELECT",
    "roles": "{anon,authenticated}",
    "qual": "true",
    "with_check": null
  },
  {
    "tablename": "projekte",
    "policyname": "p_org_read",
    "cmd": "SELECT",
    "roles": "{anon,authenticated}",
    "qual": "true",
    "with_check": null
  },
  {
    "tablename": "workspaces",
    "policyname": "p_org_read",
    "cmd": "SELECT",
    "roles": "{anon,authenticated}",
    "qual": "true",
    "with_check": null
  }
]
```


## 4b. RLS aktiviert? (pg_class)

```json
[
  {
    "relname": "firmen",
    "relrowsecurity": true,
    "relforcerowsecurity": false
  },
  {
    "relname": "projekte",
    "relrowsecurity": true,
    "relforcerowsecurity": false
  },
  {
    "relname": "workspaces",
    "relrowsecurity": true,
    "relforcerowsecurity": false
  }
]
```


## 5. Trigger (information_schema.triggers)

```json
[
  {
    "table_name": "firmen",
    "trigger_name": "trg_firmen_updated_at",
    "action_timing": "BEFORE",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION wimus.set_updated_at()"
  },
  {
    "table_name": "projekte",
    "trigger_name": "trg_projekte_updated_at",
    "action_timing": "BEFORE",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION wimus.set_updated_at()"
  },
  {
    "table_name": "workspaces",
    "trigger_name": "trg_workspaces_updated_at",
    "action_timing": "BEFORE",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION wimus.set_updated_at()"
  }
]
```


## 6a. FK AUSGEHEND (von den drei → andere Tabellen)

```json
[
  {
    "table_name": "firmen",
    "column_name": "mutter_firma_id",
    "foreign_table": "firmen",
    "foreign_column": "id",
    "constraint_name": "firmen_mutter_firma_id_fkey"
  },
  {
    "table_name": "firmen",
    "column_name": "workspace_id",
    "foreign_table": "workspaces",
    "foreign_column": "id",
    "constraint_name": "firmen_workspace_id_fkey"
  },
  {
    "table_name": "projekte",
    "column_name": "projektmanager_id",
    "foreign_table": "akteure",
    "foreign_column": "id",
    "constraint_name": "fk_projekte_projektmanager"
  },
  {
    "table_name": "projekte",
    "column_name": "firma_id",
    "foreign_table": "firmen",
    "foreign_column": "id",
    "constraint_name": "projekte_firma_id_fkey"
  },
  {
    "table_name": "projekte",
    "column_name": "parent_projekt_id",
    "foreign_table": "projekte",
    "foreign_column": "id",
    "constraint_name": "projekte_parent_projekt_id_fkey"
  },
  {
    "table_name": "projekte",
    "column_name": "workspace_id",
    "foreign_table": "workspaces",
    "foreign_column": "id",
    "constraint_name": "projekte_workspace_id_fkey"
  }
]
```


## 6b. FK EINGEHEND (Fachtabellen → die drei)

```json
[
  {
    "referencing_table": "belege",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "belege_firma_id_fkey"
  },
  {
    "referencing_table": "beteiligungen",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "beteiligungen_firma_id_fkey"
  },
  {
    "referencing_table": "crm_deals",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "crm_deals_firma_id_fkey"
  },
  {
    "referencing_table": "crm_leads",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "crm_leads_firma_id_fkey"
  },
  {
    "referencing_table": "feststellungen",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "feststellungen_firma_id_fkey"
  },
  {
    "referencing_table": "fibu_buchungen",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "fibu_buchungen_firma_id_fkey"
  },
  {
    "referencing_table": "fibu_konten",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "fibu_konten_firma_id_fkey"
  },
  {
    "referencing_table": "firmen",
    "referencing_column": "mutter_firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "firmen_mutter_firma_id_fkey"
  },
  {
    "referencing_table": "kontierungsregeln",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "kontierungsregeln_firma_id_fkey"
  },
  {
    "referencing_table": "lieferanten",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "lieferanten_firma_id_fkey"
  },
  {
    "referencing_table": "mandant_beziehungen",
    "referencing_column": "related_firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "mandant_beziehungen_related_firma_id_fkey"
  },
  {
    "referencing_table": "mandant_beziehungen",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "mandant_beziehungen_firma_id_fkey"
  },
  {
    "referencing_table": "projekte",
    "referencing_column": "firma_id",
    "target_table": "firmen",
    "target_column": "id",
    "constraint_name": "projekte_firma_id_fkey"
  },
  {
    "referencing_table": "abteilungen",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "abteilungen_projekt_id_fkey"
  },
  {
    "referencing_table": "akteur_gruppen",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "akteur_gruppen_projekt_id_fkey"
  },
  {
    "referencing_table": "citytax_saetze",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "citytax_saetze_projekt_id_fkey"
  },
  {
    "referencing_table": "funnels",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "funnels_projekt_id_fkey"
  },
  {
    "referencing_table": "kommunikationskanaele",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "kommunikationskanaele_projekt_id_fkey"
  },
  {
    "referencing_table": "kpi_api_integrationen",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "kpi_api_integrationen_projekt_id_fkey"
  },
  {
    "referencing_table": "kpi_werte",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "kpi_werte_projekt_id_fkey"
  },
  {
    "referencing_table": "landingpages",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "landingpages_projekt_id_fkey"
  },
  {
    "referencing_table": "pipelines",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "pipelines_projekt_id_fkey"
  },
  {
    "referencing_table": "projekt_channels",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "projekt_channels_projekt_id_fkey"
  },
  {
    "referencing_table": "projekte",
    "referencing_column": "parent_projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "projekte_parent_projekt_id_fkey"
  },
  {
    "referencing_table": "vorlagen",
    "referencing_column": "projekt_id",
    "target_table": "projekte",
    "target_column": "id",
    "constraint_name": "vorlagen_projekt_id_fkey"
  },
  {
    "referencing_table": "akteure",
    "referencing_column": "workspace_id",
    "target_table": "workspaces",
    "target_column": "id",
    "constraint_name": "akteure_workspace_id_fkey"
  },
  {
    "referencing_table": "channels",
    "referencing_column": "workspace_id",
    "target_table": "workspaces",
    "target_column": "id",
    "constraint_name": "channels_workspace_id_fkey"
  },
  {
    "referencing_table": "firmen",
    "referencing_column": "workspace_id",
    "target_table": "workspaces",
    "target_column": "id",
    "constraint_name": "firmen_workspace_id_fkey"
  },
  {
    "referencing_table": "projekte",
    "referencing_column": "workspace_id",
    "target_table": "workspaces",
    "target_column": "id",
    "constraint_name": "projekte_workspace_id_fkey"
  }
]
```


## 6c. Abhängige Tabellen AUSSERHALB der drei — Spalten (akteure)

```json
[
  {
    "table_name": "akteure",
    "ordinal_position": 1,
    "column_name": "id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 2,
    "column_name": "mandant_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 3,
    "column_name": "workspace_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 4,
    "column_name": "akteur_typ",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 5,
    "column_name": "name",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 6,
    "column_name": "kuerzel",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 7,
    "column_name": "email",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 8,
    "column_name": "telefon",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 9,
    "column_name": "avatar_url",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 10,
    "column_name": "sprachen",
    "data_type": "ARRAY",
    "udt_name": "_varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 11,
    "column_name": "aktiv",
    "data_type": "boolean",
    "udt_name": "bool",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 12,
    "column_name": "kontakt_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 13,
    "column_name": "benutzer_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 14,
    "column_name": "stundenlohn_brutto",
    "data_type": "numeric",
    "udt_name": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 15,
    "column_name": "ag_sv_pct",
    "data_type": "numeric",
    "udt_name": "numeric",
    "is_nullable": "YES",
    "column_default": "21.00"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 16,
    "column_name": "urlaubstage",
    "data_type": "integer",
    "udt_name": "int4",
    "is_nullable": "YES",
    "column_default": "24"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 17,
    "column_name": "krank_tage_avg",
    "data_type": "numeric",
    "udt_name": "numeric",
    "is_nullable": "YES",
    "column_default": "5.0"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 18,
    "column_name": "bereich",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 19,
    "column_name": "ki_modell",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 20,
    "column_name": "ki_typ",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 21,
    "column_name": "ki_system_prompt",
    "data_type": "text",
    "udt_name": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 22,
    "column_name": "ki_wissensbasis",
    "data_type": "text",
    "udt_name": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 23,
    "column_name": "ki_konfidenz_schwelle",
    "data_type": "numeric",
    "udt_name": "numeric",
    "is_nullable": "YES",
    "column_default": "0.70"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 24,
    "column_name": "ki_max_antworten",
    "data_type": "integer",
    "udt_name": "int4",
    "is_nullable": "YES",
    "column_default": "3"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 25,
    "column_name": "retell_agent_id",
    "data_type": "character varying",
    "udt_name": "varchar",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 26,
    "column_name": "telegram_bot_token",
    "data_type": "text",
    "udt_name": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 27,
    "column_name": "kosten_pro_aktion",
    "data_type": "numeric",
    "udt_name": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 28,
    "column_name": "oversight_akteur_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 29,
    "column_name": "score_aktuell",
    "data_type": "integer",
    "udt_name": "int4",
    "is_nullable": "YES",
    "column_default": "50"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 30,
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 31,
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "udt_name": "timestamptz",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "akteure",
    "ordinal_position": 32,
    "column_name": "typ",
    "data_type": "text",
    "udt_name": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "akteure",
    "ordinal_position": 33,
    "column_name": "organisation_id",
    "data_type": "uuid",
    "udt_name": "uuid",
    "is_nullable": "YES",
    "column_default": null
  }
]
```


## 6d. Abhängige Tabellen AUSSERHALB der drei — Constraints

```json
[
  {
    "table_name": "akteure",
    "constraint_type": "CHECK",
    "constraint_name": "akteure_akteur_typ_check",
    "column_name": null,
    "foreign_table": "akteure",
    "foreign_column": "akteur_typ",
    "check_clause": "(((akteur_typ)::text = ANY ((ARRAY['mensch'::character varying, 'ki_agent'::character varying, 'hybrid'::character varying, 'extern'::character varying])::text[])))"
  },
  {
    "table_name": "akteure",
    "constraint_type": "CHECK",
    "constraint_name": "akteure_ki_typ_check",
    "column_name": null,
    "foreign_table": "akteure",
    "foreign_column": "ki_typ",
    "check_clause": "(((ki_typ)::text = ANY ((ARRAY['posteingang'::character varying, 'gaeste_support'::character varying, 'buchung'::character varying, 'mahnwesen'::character varying, 'telefon_retell'::character varying, 'telegram_bot'::character varying, 'dokument_ocr'::character varying, 'revenue'::character varying, 'rechts'::character varying, 'bewerber'::character varying, 'checklisten'::character varying, 'seo_agent'::character varying, 'sonstige'::character varying])::text[])))"
  },
  {
    "table_name": "akteure",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24670_1_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "id IS NOT NULL"
  },
  {
    "table_name": "akteure",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24670_4_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "akteur_typ IS NOT NULL"
  },
  {
    "table_name": "akteure",
    "constraint_type": "CHECK",
    "constraint_name": "21022_24670_5_not_null",
    "column_name": null,
    "foreign_table": null,
    "foreign_column": null,
    "check_clause": "name IS NOT NULL"
  },
  {
    "table_name": "akteure",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "akteure_benutzer_id_fkey",
    "column_name": "benutzer_id",
    "foreign_table": "benutzer",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "akteure",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "akteure_oversight_akteur_id_fkey",
    "column_name": "oversight_akteur_id",
    "foreign_table": "akteure",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "akteure",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "akteure_mandant_id_fkey",
    "column_name": "mandant_id",
    "foreign_table": "mandanten",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "akteure",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "akteure_organisation_id_fkey",
    "column_name": "organisation_id",
    "foreign_table": "organisationen",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "akteure",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "akteure_workspace_id_fkey",
    "column_name": "workspace_id",
    "foreign_table": "workspaces",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "akteure",
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "akteure_kontakt_id_fkey",
    "column_name": "kontakt_id",
    "foreign_table": "kontakte",
    "foreign_column": "id",
    "check_clause": null
  },
  {
    "table_name": "akteure",
    "constraint_type": "PRIMARY KEY",
    "constraint_name": "akteure_pkey",
    "column_name": "id",
    "foreign_table": "akteure",
    "foreign_column": "id",
    "check_clause": null
  }
]
```
