---
id: 0008
titel: Custom-Field-Schicht + Kontaktmodell — Prozesse
modul: felder
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 008_felder_000_konzept.md
---

# 0008 — Prozesse & UI

> Status: Vorab-Spec (Soll), Bau folgt.

## 1. UI-Bereiche

| Bereich | Pfad | Aufgabe |
|---------|------|---------|
| Feld-Verwaltung | `/einstellungen/felder` | Custom Fields je Entität anlegen/pflegen (Pipedrive „Data fields"-Analog) |
| Typ-Verwaltung | `/einstellungen/kontakttypen` | Kontakt-/Organisationstypen (geschützte nicht löschbar) |
| Person/Organisation | `/kontakte/*` | Detail-/Anlege-Views inkl. Custom Fields + Typen + Verknüpfung |

## 2. Prozess: Custom Field definieren (UI)

1. Entität wählen (Person/Organisation/Vorgang/Objekt/Einheit).
2. „+ Feld" → Label + Typ (Text/Zahl/Datum/Auswahl/Mehrfachauswahl/JaNein) + ggf. Optionen +
   pflicht/Gruppe/Sortierung. `key` wird stabil aus dem Label generiert (slug), bleibt fix.
3. Speichern → `custom_field_def` (+ `custom_field_option`). Feld erscheint sofort in Detail-/
   Anlege-View der Entität und als Filter in Listen (über 0006).
4. **Typ nicht änderbar nach Anlage** (wie Pipedrive) — Datenintegrität. Label/Optionen-Label
   jederzeit änderbar (key stabil).
5. Geschützte Felder/Optionen: Lösch-/Umbenenn-/Key-Schutz serverseitig.

## 3. Prozess: Wert erfassen/ändern

- In der Entitäts-Detailseite: Custom Fields werden je Typ als passendes Eingabe-Element
  gerendert (Text/Zahl/Datum-Picker/Select/Multiselect/Switch).
- `value.ts setWert(...)` schreibt typgerecht (Variante C: passende wert_*-Spalte; Variante B:
  JSONB-Key). Pflichtfelder validiert.

## 4. Prozess: Filtern nach Custom Field (über 0006)

1. Liste einer Entität öffnet `filter-bar` (0006), die neben festen Spalten auch die dynamischen
   Custom-Field-Filter zeigt (aus `filter-adapter.ts`).
2. Nutzer filtert z.B. „Auswahl ‚Energieberater' = ja" + „Zahl ‚Budget' > 500".
3. Query-Builder (0006) übersetzt in die gewählte Speicher-Variante; RLS-konform; Liste
   aktualisiert. Mehrere Custom-Field-Filter UND-verknüpfbar.

## 5. Prozess: Kontakttyp/Organisationstyp zuweisen

- In Person/Organisation-Detail: Typen-Multiselect (aus `kontakt_typen`, gefiltert nach
  gilt_fuer). Mehrfach möglich (Makler UND Eigentümer).
- Geschützte System-Typen sind wählbar, aber in der Typ-Verwaltung nicht löschbar/umbenennbar.
- Module (FiBu/Belegung/Mahnlauf) prüfen Zugehörigkeit über den stabilen `key` der System-Typen.

## 6. Prozess: Person ↔ Organisation verknüpfen

- In Person: Organisation(en) zuordnen (+ Funktion/Position, ist_primaer).
- In Organisation: Ansprechpartner (Personen) sehen/hinzufügen.
- Kommunikation (0007) und Historie (0009) hängen an Person UND/ODER Organisation (Bezug).

## 7. Fehler-/Randverhalten

- Doppelter Feld-`key` je Entität → abfangen (unique). Label-Duplikate erlaubt (key entscheidet).
- Löschen eines Feldes mit Werten → Warnung „löscht Feld + alle Werte" (wie Pipedrive),
  geschützte gar nicht löschbar.
- Variantenwechsel C↔B: nur über Service-Schicht + Migrationsskript, Konsumenten unberührt.

## 8. Tests (Soll)

- Unit: key-Generierung/Stabilität, geschuetzt-Schutz (Lösch-/Umbenenn-Guard), Wert-Typvalidierung,
  filter-adapter (def→filterFields je Typ).
- RLS-Test: Nutzer A sieht keine Felder/Werte von Mandant B.
- Integration: Feld anlegen → Wert setzen → danach filtern (über 0006) liefert korrekt.
- Variante C: Multi-Feld-Filter-Performance-Smoke (Joins/EXISTS) auf Seed-Daten.

## 9. Offen → Claude Code (Report)
1. Reihenfolge: Person/Organisation-Trennung + Typen zuerst (konkreter Bedarf), generische
   Custom Fields + 0006-Andockung als zweite Stufe — bestätigen/anpassen.
2. Welche Entitäten initial Custom Fields (Person/Organisation sicher).
3. Speicher-Variante C/B (s. Datenmodell) + Index-Strategie an realer Last.
4. 0006-Spec-Ergänzung „dynamische Felder" terminieren.
