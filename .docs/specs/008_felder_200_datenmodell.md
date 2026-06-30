---
id: 0008
titel: Custom-Field-Schicht + Kontaktmodell — Datenmodell
modul: felder
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 008_felder_000_konzept.md
---

# 0008 — Datenmodell & Architektur

> Status: **GEBAUT (Migration 027, 375 Tests grün; SQL einzuspielen).** Im `wimus`-Schema, RLS
> mandant_isolation. **Variante C gewählt** (typisierte Wert-Spalten; §3). Kontaktmodell durch
> ERWEITERUNG des Bestehenden, nicht neu — reale Namen unten.

## 0. Reales Kontaktmodell (verifiziert) — Erweiterung statt Neubau

- **„Person" = `kontakte` mit `kontakt_typ='person'`** (Single-Table-polymorph: kontakt_typ
  person|firma, Rollen-Flags `ist_mieter/ist_eigentuemer/…`, `organisation_id` 1:n, `firma_id`
  Self-FK). NICHT durch neue `personen`-Tabelle ersetzt.
- **„Organisation" = bestehende `organisationen`** (Migration 012, Geschäftspartner-Stamm).
- Nur die FEHLENDEN Stücke ergänzt: n:m-Typen + n:m `person_organisation` (additiv zur 1:n).
- ⚠ Doppelspur `kontakte.ist_*`-Flags ↔ neue System-Typen bewusst belassen (Flags von lib/fibu +
  api/kontakte?rolle= genutzt) — Vereinheitlichung später (Backlog).

## 1. Kontaktmodell (Person / Organisation)

> ⚠ Reale `kontakte`-Struktur zuerst prüfen — ggf. erweitern statt neu. Falls `kontakte` heute
> ein gemischter Topf ist, Migrationspfad zu getrennten Objekten (oder Diskriminator-Feld).

### personen ‹oder bestehende kontakte erweitern›
```
id PK, mandant_id FK (RLS), anrede, vorname, nachname, email, telefon, mobil,
geburtsdatum NULL, notiz, aktiv, created_at, updated_at
```

### organisationen ‹prüfen ob existiert›
```
id PK, mandant_id FK (RLS), name, rechtsform NULL, anschrift…, ust_id NULL, notiz,
aktiv, created_at, updated_at
```

### person_organisation (n:m Ansprechpartner)
```
id PK, person_id FK, organisation_id FK, funktion NULL (z.B. „Geschäftsführer"), ist_primaer bool
```

### kontakt_typen (Stammdaten, UI-pflegbar)
```
id PK, mandant_id FK, gilt_fuer (person|organisation), key STABIL, label, geschuetzt bool,
beschreibung, sortierung, aktiv
```
- System-Typen `geschuetzt=true` (Mieter/Lieferant/Eigentümer — Code matcht `key`), per
  idempotenter Migration geseedet, nicht löschbar/umbenennbar. Freie Typen über UI.

### kontakt_typ_zuordnung (n:m)
```
id PK, typ_id FK, ziel_typ (person|organisation), ziel_id, UNIQUE(typ_id, ziel_typ, ziel_id)
```
> Ein Kontakt kann mehrere Typen haben (Makler UND Eigentümer).

## 2. Custom-Field-Definition (gemeinsam für beide Varianten)

### custom_field_def
```
id PK, mandant_id FK,
entitaet (person|organisation|vorgang|objekt|einheit|…),   -- Dimension
key STABIL (slug, unique je entitaet+mandant), label,
typ (text|zahl|datum|auswahl|mehrfachauswahl|janein),
geschuetzt bool, pflicht bool, sortierung, gruppe NULL, aktiv,
created_at, updated_at
```

### custom_field_option (für auswahl/mehrfachauswahl)
```
id PK, def_id FK, key STABIL, label, sortierung, aktiv
```
> Optionen haben ebenfalls stabilen `key` (Pipedrive-Prinzip) — Label umbenennbar.

## 3. Custom-Field-Werte — VARIANTE C GEBAUT (B als Migrationsreserve)

> Variante C gewählt+gebaut (Migration 027). Reale Tabellen (Erweiterung der bisher ungenutzten
> 002-Custom-Field-Tabellen): `custom_field_definitionen`, `custom_field_option` (NEU),
> `custom_field_werte`, `custom_field_value_option` (NEU). Feldschlüssel = `feldschluessel`,
> Options-Key = `opt_key`, bezug = `bezug_typ`/`bezug_id`.

### Variante C (GEBAUT): EAV mit typisierten Wert-Spalten
```
custom_field_value:
  id PK, mandant_id FK, def_id FK,
  entitaet, entitaet_id,                       -- an welcher Zeile hängt der Wert
  wert_text TEXT NULL, wert_zahl NUMERIC NULL, wert_datum DATE NULL, wert_bool BOOL NULL,
  created_at, updated_at
  UNIQUE(def_id, entitaet, entitaet_id)        -- ein Wert je Feld je Zeile (außer Mehrfach)
custom_field_value_option:                      -- nur für mehrfachauswahl (n Optionen)
  id PK, value_id FK, option_id FK, UNIQUE(value_id, option_id)
```
- **Indizes (B-Tree je Typ-Spalte, partiell):**
  `(entitaet, def_id, wert_text)`, `… wert_zahl`, `… wert_datum`, `… wert_bool` —
  jeweils `WHERE wert_* IS NOT NULL` (partiell = schlank). Auswahl filtert über
  `custom_field_value_option (option_id)`.
- **Vorteil:** physische, typisierte, indizierbare Wert-Spalten → sauber filter-/sortierbar je
  Feld; vermeidet das „alles-als-Text"-EAV-Antipattern.
- **Nachteil:** Filter über mehrere Custom Fields = mehrere Joins/Self-Joins (CTEs/EXISTS
  mildern). Bei unserer Feldzahl/Last vertretbar.

### Variante B (NICHT gebaut — Migrationsreserve hinter Service-Schicht): JSONB-Hybrid
```
-- an der jeweiligen Entitäts-Tabelle (oder einer Seitentabelle je Entität):
ALTER TABLE wimus.<entitaet> ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
CREATE INDEX idx_<entitaet>_cf_gin ON wimus.<entitaet> USING gin (custom_fields);
-- Werte: { "<def_key>": <wert>, "<def_key2>": [<opt_key>,…] }
```
- **Vorteil:** ein Join weniger, weniger Tabellen, flexibel.
- **Nachteil:** Filterung gröber (GIN exakt/Containment), Range/Sort braucht explizites Casting
  (`(custom_fields->>'key')::numeric`) + Expression-Index je oft-gefiltertem Feld; Query-Planer
  „sieht" die Felder schlechter.

### Entscheidungsregel (Claude Code, im Report begründen)
Default C. B nur, wenn reale Multi-Feld-Filterlast die Joins messbar bremst ODER sehr viele
sparse Felder. Bei geringer Feldzahl/Last → C (saubere Typisierung). Messen, nicht raten.
**Beide Varianten verbergen sich hinter derselben Service-Schnittstelle** (`lib/felder/`), sodass
ein späterer Wechsel die Konsumenten (UI, 0006-Filter) nicht bricht.

## 4. Service-Schicht (`lib/felder/`)

```
types.ts          FieldDef, FieldType, FieldValue, EntityRef
definition.ts     CRUD Felddefinitionen + Optionen (key-Generierung, geschuetzt-Schutz)
value.ts          getWerte(entitaet,id) / setWert(...) — kapselt Variante C ODER B
typen.ts          Kontakt-/Organisationstypen (System-Schutz, Zuordnung)
filter-adapter.ts  erzeugt dynamische filterFields für Modul 0006 aus custom_field_def
```
- Konsumenten sprechen NUR die Service-Schicht, nie direkt die Wert-Tabellen/JSONB → Varianten-
  Wechsel C↔B bleibt gekapselt.

## 5. Andockung an Suche/Filter (Modul 0006)

- `filter-adapter.ts` liefert je Entität die aktiven `custom_field_def` als dynamische
  `filterFields` (column=Feld-key, type=Feldtyp→Filter-Operatoren) an die 0006-Registry.
- `filter-bar.tsx` (0006) rendert die Custom-Field-Filter automatisch mit; Query-Builder (0006)
  übersetzt sie — bei Variante C in Joins/EXISTS auf custom_field_value, bei B in JSONB-Ausdrücke.
- **Kein zweites Filtersystem.** 0006-Spec später um „dynamische Felder" ergänzen.

## 6. RLS / Sicherheit

- Alle Tabellen RLS `mandant_isolation`. Werte erben den Mandanten der Entität.
- `geschuetzt`-Felder/-Typen: serverseitig gegen Löschen/Umbenennen/Key-Änderung schützen
  (nicht nur UI — API-Guard).

## 7. Offen → Claude Code (Report)
1. Reale `kontakte`-Struktur (Person/Firma getrennt? Migrationspfad).
2. **Speicher-Variante C vs. B** an realer Last entscheiden + begründen.
3. `fibu_lieferanten` ↔ Organisationstyp „Lieferant" (Doppelung).
4. Welche Entitäten initial Custom Fields bekommen (Person/Organisation sicher; Vorgang/Objekt/
   Einheit nach Bedarf).
5. Index-Strategie an realer Filterlast feinjustieren.
