---
gehoert_zu: 0010
dokument: Architektur
geaendert: 2026-06-29
---

# 0010 — Architektur (Berechtigungen)

> Version & Status des Moduls stehen in `010_berechtigungen_000_konzept.md`.
> Dieses Dokument löst die Engine-Tiefenfragen, die vor dem Stufe-1-Bau geklärt sein müssen.
> Baut auf 0001 (rollen/benutzer_rollen/user_mandanten) auf. Alle ‹…› vor Bau real verifizieren.

## A1 — Die #21-Kollision: Scope-Achse ist beweglich (ZENTRAL)

**Problem:** Das Datenmodell (200) verankert `scope_typ ∈ global/mandant/gesellschaft/objekt`.
Aber #21 löst genau diese Achse ab: mandant entfällt, firma (an objekt) + projekt (an einheit)
werden die Wurzeln. Baut man 010 Stufe 1 jetzt hart gegen mandant/gesellschaft, muss die komplette
Engine bei #21 Phase C neu geschrieben werden — doppelte Arbeit + Migrations-Risiko.

**Entscheidung (Reihenfolge-Kopplung 010 ↔ #21):**
- **010 Stufe 1 (Engine + Datenmodell) wird ERST NACH #21 Phase B gebaut** — wenn firma_id (objekt)
  + projekt_id (einheit) real existieren und befüllt sind. Dann kennt die Engine ihre Zielachse.
- **`scope_typ`-Werteliste = die ZIEL-Achse:** `global / firma / projekt / objekt / einheit`
  (NICHT mandant/gesellschaft). Begründung: firma ersetzt gesellschaft, projekt ist neu (an
  einheit), mandant entfällt. objekt/einheit bleiben als feinste Scopes (ein Hausmeister für EIN
  Gebäude; eine Kraft für EINE Einheit).
- **Übergang:** Solange #21 Phase C nicht durch ist, läuft die ALTE `mandant_isolation`-RLS weiter
  (010 Stufe 2 == #21 Phase C, dieselbe Operation). 010 Stufe 1 baut die Engine, schaltet sie aber
  nicht scharf — genau wie ohnehin geplant. Die Engine liest firma/projekt von Anfang an richtig.

> **Konsequenz für die Reihenfolge:** #21 B0–B3 (firma/projekt real) → 010 Stufe 1 (Engine gegen
> firma/projekt) → 010 Stufe 2 == #21 Phase C (RLS scharf, modulweise). 010 NICHT vor #21 B bauen.

## A2 — Drei Auflösungspfade (nicht zwei) nach der Zwei-Ebenen-Korrektur

**Problem:** Das Datenmodell (200) hat `erlaubte_mandanten()` + `erlaubte_objekte()`. Aber nach der
#21-Zwei-Ebenen-Korrektur (firma@objekt, projekt@einheit) reichen zwei Pfade nicht — die Daten
hängen an DREI verschiedenen Ankern, und eine Ressource muss über ihren richtigen Anker aufgelöst
werden.

**Die drei realen Anker (aus Schema 002 + #21 verifiziert):**
| Anker | Tabellen (Beispiele) | Scope-Auflösung |
|-------|----------------------|-----------------|
| **firma@objekt** | objekte, + alles was über objekt_id erbt | Ressource→objekt→firma_id; firma-Scope prüft firma_id, objekt-Scope die objekt_id |
| **projekt@einheit** | einheiten, mietvertraege, buchungen (einheit_id!) | Ressource→einheit→projekt_id; projekt-Scope prüft projekt_id, einheit-Scope die einheit_id |
| **firma direkt** | fibu_buchungen/konten, belege, lieferanten (firma_id-Direktbezug) | firma_id direkt an der Zeile |

**Engine-Funktionen (überarbeitet gegenüber 200):**
- `erlaubte_firmen(bereich, minstufe) → setof uuid` — firma-IDs, für die der User im Bereich die
  Stufe hat. Deckt firma-Scope + global.
- `erlaubte_projekte(bereich, minstufe) → setof uuid` — projekt-IDs analog. Deckt projekt-Scope +
  global (+ firma-Scope vererbt auf alle Projekte der Firma? s. A3).
- `erlaubte_objekte(bereich, minstufe) → setof uuid` — objekt-IDs (feinster Objekt-Scope + alles
  darüber vererbt).
- `erlaubte_einheiten(bereich, minstufe) → setof uuid` — einheit-IDs (feinster Einheit-Scope +
  Vererbung von projekt/firma/objekt).
- `hat_recht(bereich, minstufe, {firma_id?, projekt_id?, objekt_id?, einheit_id?}) → bool` —
  Convenience; nimmt den vorhandenen Anker der Ressource und prüft gegen die passende setof-Funktion.

> **Wichtig:** Welche setof-Funktion eine RLS-Policy nutzt, hängt vom Anker der TABELLE ab:
> objekt-gebundene Tabelle → `objekt_id in (select erlaubte_objekte(...))`; einheit-gebundene →
> `einheit_id in (select erlaubte_einheiten(...))`; firma-direkte (fibu) → `firma_id in (select
> erlaubte_firmen(...))`. Pro Tabelle im Stufe-2-Auftrag den richtigen Anker wählen (nicht raten).

## A3 — Scope-Vererbung: die Richtungsregeln (sonst Leak oder Aussperrung)

Die Vererbung MUSS eindeutig definiert sein, sonst entstehen genau die zwei Fehlerarten (zu viel /
zu wenig). Regel: **ein Scope gilt für seinen Knoten UND alles hierarchisch darunter.**

Hierarchie nach #21: `firma → objekt → einheit` (Besitz-Kette) und `projekt → einheit`
(Nutzungs-Kette). Zwei Ketten, die sich in der Einheit treffen.

| Scope des Users | erlaubte firmen | erlaubte objekte | erlaubte einheiten | erlaubte projekte |
|-----------------|-----------------|------------------|--------------------|--------------------|
| global | alle | alle | alle | alle |
| firma=F | F | objekte mit firma_id=F | einheiten dieser objekte | ‹A3-Frage› |
| projekt=P | ‹A3-Frage› | ‹A3-Frage› | einheiten mit projekt_id=P | P |
| objekt=O | firma von O | O | einheiten von O | projekte dieser einheiten? ‹A3-Frage› |
| einheit=E | firma von E's objekt | objekt von E | E | projekt von E |

**ENTSCHEIDUNG (Max 2026-06-29): EXPLIZITE Freischaltung statt automatischer Projekt-Vererbung.**
Projekt-Zugriff wird pro Benutzer EINZELN freigeschaltet, wenn nötig — es gibt KEINE automatische
Vererbung über Projektgrenzen. „Explicit over implicit", DSGVO-sicher per Default.

- **firma-Scope → Projekte: KEINE automatische Vererbung.** Firma-Scope gilt für die BESITZ-Ebene
  (Objekte, firma-direkte FiBu-Tabellen — der Verwalter/Buchhalter der Firma). Projekt-Zugriff ist
  davon GETRENNT und wird explizit zugewiesen. Wer AAP UND ACA sehen soll, bekommt beide
  Projekt-Zuweisungen. → die heikle „firma→welche Projekte"-Vererbung (A3-1) ENTFÄLLT komplett.
- **projekt-Scope → nur eigene Einheiten (restriktiv).** Ein AAP-Leiter sieht NUR Einheiten mit
  projekt_id=AAP, NIE die ACA-Einheiten im selben Haus. Braucht er auch ACA, wird er für ACA
  freigeschaltet (zweite Zuweisung). Objekt-Stammdaten (Adresse) ggf. lesend über seine Einheiten;
  fremde Einheit-Daten NIE. Kein automatischer Objekt-weiter Durchgriff.

> **Der Clou:** Weil Projekt-Zugriff IMMER explizit ist, kann der DSGVO-Leak (AAP-Leiter sieht
> ACA-Mieterdaten) gar nicht durch eine Vererbungsregel entstehen — er müsste aktiv für ACA
> freigeschaltet werden. Das vereinfacht die Engine (keine firma→projekt-Brücke) UND ist sicherer.
> Die Matrix-B-UI (Scope-Umschalter + Checkbox) IST der Freischalt-Mechanismus: pro Projekt ein
> Haken. Ein Benutzer bei mehreren Projekten = mehrere Haken über den Scope-Umschalter.

## A4 — Performance: der Auflösungs-Cache

**Problem:** Die Vererbung (Ressource→einheit→objekt→firma hochlaufen + Bereich/Stufe prüfen) ist
teurer als das heutige `mandant_id in (select user_mandanten())`. Bei jeder Zeile die ganze Kette
JOINen tötet die Performance.

**Lösung (wie user_mandanten, aber materialisiert je Request):**
- Engine-Funktionen `stable security definer` → PG cached das Ergebnis pro Statement (nicht pro
  Zeile). Der `IN (SELECT erlaubte_objekte(...))`-Pattern wird einmal ausgewertet, nicht je Zeile.
- Die setof-Funktionen berechnen die erlaubten IDs EINMAL (nicht rekursiv je Zeile): sie lesen die
  benutzer_rollen des Users, expandieren die Scopes über die Hierarchie zu einer flachen ID-Menge,
  geben die zurück. Die Policy macht dann nur noch `id IN (menge)`.
- Indizes: `benutzer_rollen(benutzer_id, scope_typ, scope_id)` (Engine-Lookup), plus die FK-Indizes
  auf firma_id/projekt_id/objekt_id (für die Expansion). ‹objekte.firma_id, einheiten.projekt_id
  bekommen in #21 B2 ohnehin Indizes — für die Engine mitnutzen›.
- **Grenze:** Bei ~27 Einheiten/10 Objekten/2 Firmen ist die Menge winzig — Performance ist real
  kein Problem. Die Sorgfalt ist Vorsorge für Wachstum, nicht akutes Tuning. NICHT über-optimieren.

## A5 — service_role & Anti-Lockout (Betriebssicherheit)

- **service_role umgeht RLS komplett** (Postgres-Prinzip). Alle API-Routen, die service_role nutzen
  (n8n-Webhooks, Migrations-Skripte, Server-Actions mit Admin-Client), haben KEINEN RLS-Schutz →
  müssen `hat_recht()` SELBST aufrufen, wo sie im Namen eines Users handeln. Das ist eine
  Bau-Konvention für Stufe 2, keine DB-Mechanik. In jedem Stufe-2-Auftrag prüfen: welche Routen
  nutzen service_role, und rufen sie hat_recht?
- **Anti-Lockout (H2 aus Konzept):** JEDE Engine-Funktion beginnt mit dem superadmin-Kurzschluss —
  hat der User eine gültige global-superadmin-Zuweisung, gibt die Funktion sofort „alles erlaubt"
  zurück, ohne die Matrix zu befragen. So sperrt weder ein Matrix-Bug noch eine kaputte Policy den
  Admin aus. Der Kurzschluss wird in Stufe 1 mitgebaut + getestet (Test: superadmin sieht alles,
  auch wenn rolle_rechte leer wäre).

## A6 — Teststrategie-Tiefe (was „Negativ-Test" konkret heißt)

Pro in Stufe 2 umgestellter Tabelle mindestens diese Fälle (H3 aus Konzept, hier konkretisiert):
- **Isolation (Leak-Test):** User mit firma-Scope VVG darf KEINE Zeile mit firma_id=WIM sehen.
- **Projekt-Grenze im selben Haus (der kritische):** User mit projekt-Scope AAP darf die
  WG-Einheit (projekt ACA) im selben Objekt NICHT sehen — obwohl es dasselbe Gebäude ist.
- **Stufe:** User mit lesen darf nicht schreiben (INSERT/UPDATE/DELETE scheitert an der write-Policy).
- **Vererbung positiv:** firma-Scope sieht alle Objekte/Einheiten der Firma.
- **Zeit:** abgelaufene Zuweisung (gueltig_bis < now) wirkt nicht.
- **Superadmin:** sieht alles, unabhängig von der Matrix.
- **service_role:** umgeht RLS (bestätigen, dass Server-Pfade weiter funktionieren) — UND die
  zugehörige API-Route ruft hat_recht (separater Test der Route, nicht der Policy).

## Offene Punkte (A-Serie, vor Bau klären)
- ~~A3-1: firma-Scope → alle Projekte der Firma?~~ ENTSCHIEDEN: NEIN, Projekt-Zugriff immer explizit
  (Max 2026-06-29). firma→projekt-Brücke entfällt.
- ~~A3-2: projekt-Scope → nur eigene Einheiten?~~ ENTSCHIEDEN: JA, restriktiv (nur projekt_id=P);
  weiterer Projekt-Zugriff via expliziter Freischaltung.
- A2: genaue Anker-Tabelle je Modul (welche Tabelle über objekt/einheit/firma) — im Stufe-2-Auftrag.
- A1: bestimmt — 010 Stufe 1 nach #21 Phase B, scope_typ = firma/projekt/objekt/einheit/global.

## Änderungshistorie
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-29 21:35 | Architektur-Dokument NEU: A1 #21-Kollision (010 Stufe 1 nach Phase B, scope_typ=firma/projekt/objekt/einheit/global, mandant/gesellschaft raus); A2 drei/vier Auflösungspfade statt zwei (firma@objekt, projekt@einheit, firma-direkt) — Engine-Funktionen erlaubte_firmen/projekte/objekte/einheiten; A3 Scope-Vererbungsregeln + die zwei heiklen Richtungsfragen (firma→projekte, projekt→nur eigene Einheiten = DSGVO-Kern); A4 Performance/Cache; A5 service_role + Anti-Lockout; A6 Negativ-Test-Tiefe inkl. Projekt-Grenze im selben Haus. |
