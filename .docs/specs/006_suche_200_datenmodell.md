---
id: 0006
titel: Such-/Filter-Schicht — Datenmodell
modul: suche
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 006_suche_000_konzept.md
---

# 0006 — Such-/Filter-Schicht — Datenmodell & technische Architektur

> Status: **GEBAUT (Migration 024, 332 Tests grün; SQL einzuspielen).** DB-seitig PostgreSQL
> (`pg_trgm`; FTS = Roadmap), im `wimus`-Schema, RLS über Server-Client. Verifizierte Entitäten
> s. §2.2. Stufe 1 nutzt ILIKE über gin_trgm_ops (nicht similarity(), s. §4).
> `wimus`-Schema, RLS-konform. Tabellen-/Spaltennamen mit `‹…›` sind gegen reales Schema zu
> verifizieren (s. Konzept „Offene Punkte").

## 1. Technischer Ansatz

### 1.1 Zwei PostgreSQL-Mechanismen, klar getrennt

| Mechanismus | Wofür | Verhalten |
|-------------|-------|-----------|
| **`pg_trgm`** (Trigram) | Fuzzy / Tippfehler-tolerant / Teilstring | „müller" findet „Mueller", „Mller"; Ähnlichkeits-Score 0–1 (`similarity()`), Operator `%` |
| **Full-Text-Search** (`tsvector`/`tsquery`) | Wort-/Phrasensuche, Stemming, mehrere Wörter | „offene rechnung stuttgart" → wortbasiert, deutsche Konfiguration (`german`) |

**Regel:** Kurze Bezeichner/Namen/Nummern → `pg_trgm` (Fuzzy). Längere Freitext-Felder
(Notizen, Beschreibungen) → FTS. Viele Felder kombinieren beide (Name fuzzy + Notiz FTS).

### 1.2 Extensions (Migration, idempotent)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- FTS ist in PostgreSQL core, keine Extension nötig.
-- pgvector (semantische Suche) bewusst NICHT in Stufe 1.
```

## 2. Entitäts-Registry (Herzstück)

Statt pro Modul eigenen Such-Code: EINE zentrale Registry, die deklariert, welche Entität
wie durchsuchbar/filterbar ist. Lebt als TypeScript-Konfiguration in `lib/search/registry.ts`
(nicht als DB-Tabelle — es ist Code-Konfiguration, kein Laufzeit-Datensatz).

### 2.1 Struktur je Entität

```ts
type SearchEntity = {
  key: string;              // 'mieter' | 'objekte' | 'vorgaenge' | ...
  table: string;            // reale Tabelle im wimus-Schema  ‹verifizieren›
  labelSingular: string;    // 'Mieter'
  routePattern: string;     // '/mieter/{id}'  — Sprung zum Treffer
  tenantColumn: string;     // RLS-Spalte, z.B. 'mandant_id'  ‹verifizieren›
  // Felder für Fuzzy-Trefferanzeige + globale Suche
  trigramFields: string[];  // z.B. ['name', 'email']
  // Felder für Volltextsuche
  ftsFields: string[];      // z.B. ['notizen']
  // Felder, nach denen pro-Modul gefiltert werden kann (Spalte → Typ)
  filterFields: { column: string; type: 'text'|'enum'|'date'|'number'|'bool'; }[];
  // Anzeige im globalen Trefferbild
  display: { titleField: string; subtitleField?: string; };
  // Gewichtung im globalen Ranking (höher = wichtiger)
  globalWeight: number;     // z.B. Mieter 1.0, Buchung 0.7
  inGlobalSearch: boolean;  // ob diese Entität in der globalen Suche auftaucht
};
```

### 2.2 Entitäten (Whitelist) — verifiziert gegen reales Schema (Stand 2026-06-28)

| key | reale Tabelle | in globaler Suche | globalWeight | Status |
|-----|---------------|-------------------|--------------|--------|
| kontakte | `kontakte` (= „mieter", keine eigene Tabelle) | ja | 1.0 | gebaut |
| objekte | `objekte` (kuerzel/strasse/stadt) | ja | 0.9 | gebaut |
| einheiten | `einheiten` (verwendungszweck_code/kuerzel/bezeichnung) | ja | 0.9 | gebaut |
| mietvertraege | `mietvertraege` (aktenzeichen) | ja | 0.8 | gebaut |
| vorgaenge | `vorgaenge` (aktenzeichen) | ja | 0.8 | gebaut |
| buchungen | `buchungen` (aktenzeichen) | ja | 0.7 | gebaut |
| ~~forderungen~~ | `forderungen` | — | — | RAUS (keine Trigram-Textspalte, nur Beträge/Status/FK) |
| rechnungen | `belege`? | später | 0.7 | offen (Tabelle/Felder verifizieren) |
| lieferanten | `fibu_lieferanten`? | später | 0.6 | offen (verifizieren) |
| nachrichten | `kom_nachrichten` (Modul 007) | später | 0.6 | wartet auf Modul 007 |

> Stufe 1 gebaut: die 6 oberen Entitäten. forderungen bewusst raus. Untere drei (rechnungen/
> lieferanten/nachrichten) folgen, sobald reale Tabellen verifiziert bzw. 007 gebaut ist.
> und ergänze/korrigiere im Report. Nicht raten — nicht existente Tabellen weglassen, dokumentieren.

## 3. Indizes (GIN, je durchsuchbarer Tabelle)

Pro Trigram-Feld ein GIN-Index mit `gin_trgm_ops`; für FTS ein GIN-Index auf den `tsvector`.

```sql
-- Trigram je relevante Spalte (Beispiel, je Tabelle wiederholen)
CREATE INDEX IF NOT EXISTS idx_‹tabelle›_name_trgm
  ON wimus.‹tabelle› USING gin (name gin_trgm_ops);

-- FTS: generierte tsvector-Spalte (deutsch) + GIN-Index
ALTER TABLE wimus.‹tabelle›
  ADD COLUMN IF NOT EXISTS such_vektor tsvector
  GENERATED ALWAYS AS (to_tsvector('german', coalesce(notizen,''))) STORED;
CREATE INDEX IF NOT EXISTS idx_‹tabelle›_fts
  ON wimus.‹tabelle› USING gin (such_vektor);
```

> Idempotent (`IF NOT EXISTS`). Generierte Spalte `such_vektor` hält FTS automatisch aktuell —
> kein Trigger nötig, kein Doppel-Schreiben.

## 4. Globale Suche — Umsetzungsvariante

Zwei mögliche Wege, Entscheidung als Designvorgabe getroffen:

- **Gewählt (Stufe 1): Fan-out-Query über Registry.** Die globale Suche feuert pro Entität eine
  schlanke, RLS-gefilterte Trigram-Query (limitiert, z.B. Top 5 je Entität), Ergebnisse werden
  app-seitig nach `score × globalWeight` zusammengeführt und sortiert. Vorteil: nutzt die je
  Tabelle vorhandenen Indizes, kein Spiegel-Datenmodell, RLS greift pro Tabelle natürlich.
- **Verworfen für Stufe 1: materialisierte Such-Sicht** (eine `such_index`-Tabelle, die alle
  Entitäten denormalisiert spiegelt). Schneller bei sehr vielen Entitäten, ABER: Daten-
  Duplikation, RLS auf der Sicht ist fummelig, Aktualität braucht Trigger/Refresh. → erst wenn
  Fan-out messbar zu langsam wird (Roadmap), dann bewusst als Optimierung.

## 5. Filter-Query-Builder (Pro-Modul)

Ein generischer Builder `lib/search/query-builder.ts`, der aus Filter-Eingaben eine
Supabase-/SQL-Query baut — je Modul mit dessen `filterFields` aus der Registry konfiguriert.

- Operatoren je Typ: text (`ilike`/trigram `%`), enum (`in`), date (`gte`/`lte`/range),
  number (`gte`/`lte`/`eq`), bool (`is`).
- Freitext-Suchfeld der Leiste = Trigram über die `trigramFields` der Entität + optional FTS.
- Kombinierbar (UND-verknüpft): „Status = offen" + „Betrag > 500" + Suchtext „müller".
- **Alle Queries laufen über die normale Supabase-Client-Schicht → RLS greift automatisch.**
  Kein direkter DB-Zugriff, der RLS umgeht.

## 6. RLS / Sicherheit (harte Anforderung)

- Jede Such-Query (global + Filter) läuft als normale, RLS-unterworfene Abfrage. KEINE
  Service-Role-Umgehung, KEIN direkter Pool-Zugriff für Suche.
- Globale Suche: pro Entität eigene RLS — ein Nutzer sieht nur, was er auch in der normalen
  Liste sähe. Es gibt keinen „Such-Superuser".
- Tenant-Spalte je Entität (`tenantColumn`) ist Teil der Registry, damit Mandanten-Scope
  explizit und prüfbar ist.

## 7. Performance-Leitplanken

- Globale Suche: Limit je Entität (z.B. 5) + Gesamt-Limit (z.B. 30), Debounce im UI (~250 ms),
  Mindest-Eingabelänge (≥2 Zeichen) bevor gefeuert wird.
- Trigram-Schwelle konfigurierbar (Default `similarity ≥ 0.3`), zentral in `lib/search/config.ts`
  — analog zu den konfigurierbaren Confidence-Schwellen im Bank-Abgleich.
- GIN-Indizes Pflicht für jede durchsuchbare Spalte (sonst Seq-Scan auf großen Tabellen).

## 8. Datenintegrität / Grenzen

- Kein eigenes Such-Datenmodell, das Inhalte dupliziert (außer der bewusst verworfenen
  Materialized View). Indizes + generierte `tsvector`-Spalten auf den echten Tabellen.
- Keine zweite Fuzzy-Logik: DB nutzt `pg_trgm`, In-Memory bleibt `fuzzball`. Beide bestehen
  nebeneinander mit klarer Zuständigkeit (DB-Suche vs. In-Memory-Matching).

## 9. Offen → Claude Code (Report)

1. Entitäts-Whitelist (§2.2) gegen reales Schema verifizieren: Tabelle existiert? durchsuchbare
   Felder? Tenant-Spalte?
2. Vorhandene Such-/Volltext-Indizes auf einzelnen Tabellen (nicht doppeln).
3. Fan-out-Performance an realen Datenmengen prüfen; falls zu langsam → Materialized View als
   geplante Optimierung im Report vermerken (nicht ungefragt bauen).
