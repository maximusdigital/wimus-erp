---
id: 0011
titel: Tags — Datenmodell
modul: tags
erstellt: 2026-06-29
geaendert: 2026-06-29
gehoert_zu: 011_tags_000_konzept.md
---

# 0011 — Datenmodell

> Schema `wimus`, RLS über `mandant_id` (Tag) bzw. über Eltern-Tag (Zuordnung). Polymorphes n:m
> nach dem etablierten Muster (custom_field_werte/aktivitaet_bezug). Idempotente Migration.

## 1. tags (der Tag selbst)

```
tags
  id           uuid PK default gen_random_uuid()
  mandant_id   uuid NOT NULL REFERENCES wimus.mandanten(id) ON DELETE CASCADE   -- RLS-Wurzel
  label        text NOT NULL                       -- der freie Text (Hashtag)
  farbe        text NULL                           -- optional, UI-Chip (Hex o.ä.)
  aktiv        boolean NOT NULL default true
  created_at   timestamptz NOT NULL default now()
  updated_at   timestamptz NOT NULL default now()
```

- **Eindeutigkeit je Mandant, case-insensitive** (OP-1):
  `CREATE UNIQUE INDEX ux_tags_mandant_label ON wimus.tags (mandant_id, lower(label));`
  → „Wasserschaden" == „wasserschaden" == EIN Tag. Anzeige behält die Original-Schreibweise.
- Label zentral hier → Umbenennen propagiert automatisch zu allen Zuordnungen (die zeigen nur auf
  tag_id, nicht auf den Text).

## 2. tag_zuordnung (polymorphe n:m-Verknüpfung)

```
tag_zuordnung
  id           uuid PK default gen_random_uuid()
  tag_id       uuid NOT NULL REFERENCES wimus.tags(id) ON DELETE CASCADE
  bezug_typ    text NOT NULL                       -- FREIER String: objekt|einheit|buchung|
                                                   --   vorgang|kontakt|projekt|firma|mietvertrag|…
  bezug_id     uuid NOT NULL                        -- polymorph, KEIN FK (zeigt auf bel. Tabelle)
  created_at   timestamptz NOT NULL default now()
  UNIQUE (tag_id, bezug_typ, bezug_id)             -- ein Tag nur einmal pro Datensatz
```

- `bezug_typ` ist BEWUSST ein freier String (keine CHECK-Whitelist) — jede Tabelle, auch künftige,
  ist taggbar ohne Schemaänderung (Entscheidung „an alle Bausteine").
- `bezug_id` hat KEINEN FK (polymorph kann das nicht). Konvention: bezug_id ist immer eine wimus-PK.
- Index: `CREATE INDEX ix_tagzuordnung_bezug ON wimus.tag_zuordnung (bezug_typ, bezug_id);`
  (Lookup „welche Tags hat dieser Datensatz?") + `(tag_id)` (Lookup „was hängt an diesem Tag?",
  via FK-Index ohnehin).

## 3. RLS

```
-- tags: über eigene mandant_id (Muster wie alle mandant-Kerntabellen)
ALTER TABLE wimus.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY mandant_isolation ON wimus.tags FOR ALL TO authenticated
  USING (mandant_id IN (SELECT wimus.user_mandanten()))
  WITH CHECK (mandant_id IN (SELECT wimus.user_mandanten()));

-- tag_zuordnung: über das Eltern-Tag (hat mandant_id) — Muster wie custom_field_werte
ALTER TABLE wimus.tag_zuordnung ENABLE ROW LEVEL SECURITY;
CREATE POLICY mandant_isolation ON wimus.tag_zuordnung FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM wimus.tags t
                 WHERE t.id = wimus.tag_zuordnung.tag_id
                   AND t.mandant_id IN (SELECT wimus.user_mandanten())))
  WITH CHECK (EXISTS (SELECT 1 FROM wimus.tags t
                 WHERE t.id = wimus.tag_zuordnung.tag_id
                   AND t.mandant_id IN (SELECT wimus.user_mandanten())));
```

> Konsequenz: Ein Nutzer sieht/setzt nur Zuordnungen zu Tags SEINES Mandanten. Da der getaggte
> Datensatz (bezug) ohnehin in seinem Mandanten liegt (eigene RLS dort), ist die Isolation doppelt
> sicher. Ein Tag eines fremden Mandanten an einen eigenen Datensatz zu hängen, ist nicht möglich.

## 4. Trigger

- `updated_at` auf `tags` (Standard-Trigger wimus.set_updated_at — greift automatisch über die
  bestehende DO-Schleife in 002, die alle Tabellen mit updated_at-Spalte abdeckt; tag_zuordnung hat
  bewusst KEIN updated_at, nur created_at — Zuordnungen werden nicht editiert, nur erstellt/gelöscht).

## 5. Was NICHT ins Modell kommt (bewusst)

- KEIN Tag-Typ / keine Kategorie (typenlos, Entscheidung).
- KEIN Wert je Tag (das wäre Custom Fields, 008).
- KEINE Whitelist für bezug_typ.
- KEIN FK auf bezug_id (polymorph unmöglich; Verwaisung → OP-3 Cleanup).
- KEINE Hierarchie zwischen Tags (kein parent_tag) — flach. Falls je „Tag-Gruppen" gewünscht:
  später, eigener Entscheid.

## 6. Migration

- Eine idempotente Migration `‹NNN›_tags.sql` (nächste freie Nummer real prüfen): CREATE TABLE IF
  NOT EXISTS für beide, Indizes IF NOT EXISTS, RLS DROP POLICY IF EXISTS + CREATE, GRANTS analog
  Bestand. KEIN Seed (Tags entstehen zur Laufzeit durch Nutzer).
- Reihenfolge: unabhängig von #21, kann jederzeit. Nummer ans Kettenende.
