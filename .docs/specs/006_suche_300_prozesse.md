---
id: 0006
titel: Such-/Filter-Schicht — Prozesse
modul: suche
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 006_suche_000_konzept.md
---

# 0006 — Such-/Filter-Schicht — Prozesse & UI

> Status: Vorab-Spec (Soll), Bau folgt.

## 1. Komponenten-Überblick (`lib/search/`)

| Datei | Aufgabe |
|-------|---------|
| `registry.ts` | Entitäts-Registry (welche Entität, welche Felder, RLS-Spalte, Gewicht) |
| `query-builder.ts` | generischer Filter-/Such-Query-Builder (Operatoren je Feldtyp) |
| `global-search.ts` | Fan-out über Registry, Zusammenführung + Ranking |
| `config.ts` | Schwellen (Trigram-Similarity, Limits, Debounce) — zentral konfigurierbar |
| `types.ts` | gemeinsame Typen (SearchEntity, FilterInput, SearchResult) |

UI (Shared-Components, andocken an bestehende Shadcn DataTable — NICHT ersetzen):

| Komponente | Aufgabe |
|------------|---------|
| `components/search/command-palette.tsx` | globale Suche (Command-K), modulübergreifend |
| `components/search/filter-bar.tsx` | Pro-Modul Such-/Filterleiste (Suchfeld + Filter-Chips) |

## 2. Prozess: Globale Suche (Command-K)

1. Nutzer öffnet Palette (Tastenkürzel ⌘K / Strg-K) → Suchfeld.
2. Eingabe ≥2 Zeichen, Debounce ~250 ms.
3. `global-search.ts` liest Registry, feuert pro `inGlobalSearch`-Entität eine RLS-gefilterte
   Trigram-Query (Limit je Entität, z.B. 5).
4. Ergebnisse werden zusammengeführt, sortiert nach `similarity × globalWeight`, Gesamt-Limit
   (z.B. 30), gruppiert nach Entitätstyp.
5. Anzeige: je Treffer `title`/`subtitle` aus Registry + Entitäts-Label (z.B. „Mieter").
6. Auswahl → Navigation via `routePattern` zum Datensatz.
7. **RLS:** Nutzer sieht nur Treffer, die er auch in der normalen Liste sähe. Kein Sonderrecht.

## 3. Prozess: Pro-Modul Such-/Filterleiste

1. Modul-Listenansicht bindet `filter-bar` ein, konfiguriert mit den `filterFields` +
   `trigramFields` seiner Entität aus der Registry.
2. Nutzer kombiniert: Freitext-Suchfeld (Trigram über trigramFields, optional FTS) + ein oder
   mehrere Filter-Chips (Status/Datum/Betrag/…), UND-verknüpft.
3. `query-builder.ts` baut die Supabase-Query (RLS-konform) → Liste aktualisiert sich.
4. Filter-Zustand bleibt in der URL (Query-Params), damit teilbar/bookmarkbar (Stufe 1 optional;
   sonst Component-State).
5. Leere/keine Treffer → klarer Leerzustand, kein Fehler.

## 4. Beispiele (illustrativ)

- Globale Suche „müller offen" → Mieter „Müller" (Trigram) + Forderungen „offen" gemischt,
  nach Gewicht sortiert.
- FiBu-Liste: Suchtext „rewe" + Filter „Status = nicht zugeordnet" + „Betrag > 50".
- Vorgänge: Filter „Objekt = IS17" + „Status = offen", Suchtext „heizung".

## 5. Fehler-/Randverhalten

- DB-Such-Fehler → Leerzustand + dezenter Hinweis, nie harter Crash der Liste.
- Sehr kurze Eingabe (<2 Zeichen) → nicht feuern (Performance).
- Sonderzeichen/SQL-Injection: ausschließlich über parametrisierte Supabase-Queries, nie
  String-Konkatenation.

## 6. Integration in Module (Andock-Vorgang)

Eine neue durchsuchbare Tabelle/Modul ergänzen heißt:
1. Registry-Eintrag (`SearchEntity`) hinzufügen — Tabelle, Felder, Tenant-Spalte, Gewicht.
2. Migration: GIN-Trigram-Index je Suchfeld (+ `such_vektor` falls FTS).
3. Filterleiste in die Modul-Liste einbinden (Konfiguration aus Registry).
→ Kein neuer Such-Code. Globale Suche nimmt die Entität automatisch auf (wenn `inGlobalSearch`).

## 7. Tests (Soll)

- Unit: query-builder (jeder Feldtyp/Operator), Ranking-Zusammenführung, Trigram-Schwelle.
- RLS-Test: Nutzer A findet keine Datensätze von Mandant B (global + Filter).
- Integration: globale Suche über ≥2 Entitäten liefert korrekt gemischte, gewichtete Treffer.
- Performance-Smoke: Suche auf seed-befüllter großer Tabelle nutzt Index (kein Seq-Scan).

## 8. Offen → Claude Code (Report)

1. Welche Module zuerst Filterleiste bekommen (Reihenfolge — Vorschlag: FiBu/Bank + Vorgänge
   zuerst, da dort große Tabellen + häufige Suche).
2. URL-Filter-Persistenz Stufe 1 oder später.
3. Globale-Suche-Tastenkürzel + Platzierung im Layout final.
