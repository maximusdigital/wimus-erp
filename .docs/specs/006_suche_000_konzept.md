---
id: 0006
titel: Such-/Filter-Schicht
status: in_arbeit            # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.2.0            # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: suche
erstellt: 2026-06-28
geaendert: 2026-06-28
abhaengt_von: [0001]
---

# 0006 — Such-/Filter-Schicht

## Worum geht's

Eine **querschnittliche Such- und Filter-Schicht** für das gesamte WIMUS-ERP. Kein Feature
eines einzelnen Moduls, sondern eine gemeinsame technische Einheit, an die sich alle Module
andocken — analog zur Automatik-Engine (`005_automation`) und zum Agenten-Modul. Ziel:
**einmal sauber bauen, überall nutzen** — statt n halbgarer Such-Implementierungen pro Modul.

Die Schicht bedient **zwei Konsumenten aus einer Engine**:

1. **Globale Suche** (Command-K / Spotlight-Stil): ein Suchfeld, modulübergreifend. Findet
   Mieter, Objekte, Einheiten, Verträge, Vorgänge, Buchungen, Rechnungen, Lieferanten … aus
   einer Eingabe und springt zum Treffer.
2. **Pro-Modul Such-/Filterleiste**: je Listen-/Tabellenansicht fuzzy suchen + nach allen
   relevanten Spalten/Werten filtern (Status, Datum, Betrag, Objekt, Typ …).

**Fundament: DB-seitig in PostgreSQL** (`pg_trgm` für Fuzzy/Trigram + Full-Text-Search), weil
große Tabellen erwartet werden. Läuft in der DB, skaliert auf zehntausende Zeilen, von Supabase
out-of-the-box unterstützt. Client-seitiges Fuzzy-Filtern (`fuzzball`) nur als Ergänzung für
kleine, bereits geladene Listen.

## Warum ein eigenes Modul (nicht im Kern 0001)

- **Symmetrie zu anderen Querschnitts-Funktionen:** Die Automatik-Engine wurde bewusst als
  eigenes Modul `005_automation` angelegt, obwohl auch querschnittlich. Suche ist dasselbe
  Muster („dient allen, ist aber selbst ein geschlossenes Ding") → eigenes Modul `006_suche`.
- **Kern bleibt scharf:** `001_erp` trägt bereits Org-Hierarchie, Akteure, Belegung, BK-Kerne,
  OCR, Channel-Routing. Das komplette Such-Datenmodell (GIN-Indizes, Trigram-Konfig, globale
  Such-Registry, Ranking) dort einzumischen würde es unübersichtlich machen.
- **Eigener Lebenszyklus:** Suche hat eigene Versionierung, eigenen Decision-Log (z.B. spätere
  semantische Suche via `pgvector`) und eigene Roadmap. Im Kern würde das dessen Historie
  verwässern.

## Leitprinzipien

- **Eine Engine, zwei Frontends.** Globale Suche und Pro-Modul-Filter teilen sich dieselbe
  Such-Schicht (`lib/search/`). Keine zwei Such-Welten.
- **Fuzzy konsistent zum Bestand.** `fuzzball` (In-Memory, z.B. Bank-Namensmatch) und `pg_trgm`
  (DB-Suche) sind die ZWEI erlaubten Fuzzy-Wege — keine dritte Implementierung. Grundsatz
  „fertige geprüfte Lösung vor Eigenbau": Postgres-Suche ist kampferprobt.
- **RLS ist heilig.** Die Suche darf NIE mandantenfremde oder rechtlich abgeschirmte Treffer
  zeigen. Jede Such-Query läuft unter denselben RLS-Regeln wie die normale Datenabfrage. Das
  ist bei einer globalen Suche über alle Entitäten besonders kritisch.
- **Konfiguration statt Code je Modul.** Ein generischer Query-Builder + eine zentrale
  Registry, welche Entität welche Felder durchsuchbar/filterbar macht. Neue durchsuchbare
  Tabelle = Registry-Eintrag + Index, kein neuer Such-Code.
- **Keine Daten-Duplikation für Suche.** Kein paralleles Such-Datenmodell, das Inhalte spiegelt.
  Indizes/Sichten auf die echten Tabellen, nicht Kopien davon. (Ausnahme bewusst begründet:
  ggf. eine materialisierte Sicht NUR für die globale Suche — s. Datenmodell.)

## Abgrenzung

- **Nicht** das Agenten-Modul: Die Suche liefert deterministische Treffer auf strukturierte
  Daten. Der Agent (KI-Reasoning) kann die Such-Schicht als Werkzeug NUTZEN (`getTreffer`),
  ist aber nicht Teil dieses Moduls.
- **Nicht** das OCR/Volltext-Dokumenten-Retrieval aus dem Kern: Diese Schicht durchsucht
  strukturierte ERP-Datensätze (Tabellen-Zeilen), nicht den Inhalt gescannter PDFs. Dokumenten-
  Volltext kann später als eigene durchsuchbare Entität andocken (Roadmap).
- **Nicht** semantische/Embedding-Suche (das wäre `pgvector`) — bewusst aus Stufe 1 ausgeklammert,
  als Roadmap notiert.

## Steht (gebaut & läuft)

- **Such-/Filter-Schicht GEBAUT (Migration 024, einzuspielen; 332 Tests grün):** `pg_trgm` +
  GIN-Trigram-Indizes auf verifizierten Spalten (kontakte/objekte/einheiten/mietvertraege/
  vorgaenge/buchungen). `lib/search/` (types/config/registry/query-builder/global-search).
  Globale Suche `/api/search` (Fan-out, RLS über Server-Client, Ranking score×globalWeight +
  Präfix-Bonus) + Command-Palette ⌘K. Pro-Modul-Filter `filter-bar.tsx` in Vorgänge-Liste.
- Vorhandenes, auf dem aufgebaut wird: `fuzzball`-Fuzzy-Engine (`lib/fibu/fuzzy.ts`) als
  Referenz für konsistentes Fuzzy-Verhalten; Supabase/PostgreSQL mit `wimus`-Schema + RLS;
  bestehende Listen-/Tabellen-Komponenten (Shadcn DataTable) als UI-Andockpunkt.

## In Arbeit

- **Such-/Filter-Schicht (Vorab-Spec, Bau folgt):** DB-seitige Engine (`pg_trgm` + FTS),
  generischer Query-Builder, Entitäts-Registry, globale Suche + Pro-Modul-Filterleiste.
  Datenmodell s. `006_suche_200_datenmodell.md`, Prozesse s. `006_suche_300_prozesse.md`.

## Roadmap (bewusst später)

- **Dynamische Custom-Field-Filter (Andockung Modul 0008):** Modul 0008 (felder) liefert über
  `filter-adapter.ts` dynamische `filterFields` aus `custom_field_definitionen`. Variante C dockt
  über id-Prefilter an (`customFieldIds()` → `.in("id", ids)` an die Entitäts-Query) — KEIN
  Eingriff in den Kern-Query-Builder. Voraussetzung: Filterleisten-Route je Entität. Gebaut+
  getestet in 0008, hier noch nicht eingehängt → Stufe 2.

- **Stufe 1 (dieses Spec):** `pg_trgm` + FTS, Pro-Modul-Filter + globale Suche, Registry,
  Query-Builder, Shared-UI.
- **Stufe 2:** Such-Historie / zuletzt benutzt / gespeicherte Filter je Nutzer.
- **Stufe 3:** Dokumenten-Volltext (OCR-Ergebnisse) als durchsuchbare Entität.
- **Stufe 4:** Semantische Suche via `pgvector` (Embeddings) — für unscharfe „meinte ich
  vielleicht"-Treffer. Erst wenn Stufe 1 trägt und Bedarf da ist.

## Offene Punkte → Claude Code verifiziert gegen reales Schema

> Diese Spec ist zu ~99% entscheidungsfest. Die folgenden Punkte hängen an der REALEN
> Tabellen-/Spalten-Struktur, die nur am lebenden Code final bestimmbar ist. Claude Code
> verifiziert sie beim Bau gegen das echte `wimus`-Schema und schärft sie im Report —
> NICHT raten.

1. **Entitäts-Whitelist globale Suche:** Welche Tabellen real existieren und in die globale
   Suche gehören (Kandidaten s. Datenmodell), inkl. der je Entität durchsuchbaren Felder.
2. **RLS-Spaltennamen:** Exakte Mandanten-/Tenant-Spalte je Tabelle (vermutlich `mandant_id` /
   `firma_id` / `workspace_id`) für die RLS-konforme Such-Query.
3. **Vorhandene Volltext-/Index-Strukturen:** Ob auf einzelnen Tabellen schon Such-Indizes
   existieren (nicht doppeln).

## Decision-Log

- 2026-06-28: **Stufe 1 ILIKE statt similarity()** — `ILIKE '%q%'` index-beschleunigt über
  `gin_trgm_ops`, Score = Gewicht + Präfix-Bonus. Echtes `similarity()`-Ranking braucht RPC
  (über Supabase-Client nicht direkt filterbar) → Roadmap, erst wenn Treffer-Qualität stört.
- 2026-06-28: **„mieter" = `kontakte`** (keine eigene mieter/personen-Tabelle).
- 2026-06-28: **`forderungen` NICHT in der Suche** — keine Trigram-taugliche Textspalte
  (nur Beträge/Status/FK).
- 2026-06-28: **FTS (such_vektor) in Stufe 1 weggelassen** — Kern-Entitäten ohne großes
  Freitextfeld; FTS = Roadmap (Notizen/Beschreibungen).
- 2026-06-28: **rechnungen/lieferanten/nachrichten noch nicht in Registry** — reale Tabellen
  nicht final verifiziert; `nachrichten` kommt erst mit Modul 007 (`kom_nachrichten`).

- 2026-06-28: **Eigenes Modul `006_suche`** statt Einbettung in Kern 0001 — Symmetrie zu
  `005_automation`, Kern bleibt scharf, eigener Lebenszyklus.
- 2026-06-28: **DB-seitig (`pg_trgm` + FTS) als Fundament**, nicht client-seitig — große
  Tabellen erwartet; client-`fuzzball` nur Ergänzung für kleine geladene Listen.
- 2026-06-28: **Eine Engine, zwei Konsumenten** (globale Suche + Pro-Modul-Filter) — keine zwei
  Such-Welten.
- 2026-06-28: **Keine dritte Fuzzy-Implementierung** — `fuzzball` (in-memory) + `pg_trgm` (DB)
  sind die zwei erlaubten Wege.
- 2026-06-28: **RLS-Konformität als harte Anforderung** — Such-Query läuft unter denselben
  RLS-Regeln; globale Suche darf nie mandantenfremde Treffer zeigen.
- 2026-06-28: **Semantische Suche (`pgvector`) bewusst aus Stufe 1 ausgeklammert** (Roadmap).

## Meilensteine

| Version | Datum | Status | Beschreibung |
|---------|-------|--------|--------------|
| 0.2.0 | 2026-06-28 | in_arbeit | GEBAUT (Migration 024, 332 Tests grün): pg_trgm+GIN, lib/search, globale Suche ⌘K + Pro-Modul-Filter (Vorgänge). Stufe 1 ILIKE; mieter=kontakte; forderungen raus; FTS/similarity/restliche Entitäten = Roadmap. |
| 0.1.0 | 2026-06-28 | entwurf | Vorab-Spec Such-/Filter-Schicht: eigenes Modul 006, DB-seitig (pg_trgm+FTS), globale Suche + Pro-Modul-Filter, Registry/Query-Builder, RLS-konform. Bau folgt. |

## Änderungshistorie

| Datum/Zeit (MESZ) | Vorgang | Dateien |
|-------------------|---------|---------|
| 2026-06-28 12:00 | v0.2.0: GEBAUT nachgezogen (Migration 024, ILIKE-Stufe-1, mieter=kontakte, forderungen raus, FTS/similarity Roadmap) | 000,200,300 |
| 2026-06-28 20:45 | v0.1.0: Modul 006_suche als Vorab-Spec angelegt (Konzept/Datenmodell/Prozesse) | 000,200,300 |
