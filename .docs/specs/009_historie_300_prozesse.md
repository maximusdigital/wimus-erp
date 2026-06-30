---
id: 0009
titel: ERP-weite Historie + Audit-Log — Prozesse
modul: historie
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 009_historie_000_konzept.md
---

# 0009 — Prozesse & UI

> Status: Vorab-Spec (Soll), Bau folgt.

## 1. UI-Bereiche

| Bereich | Pfad | Aufgabe |
|---------|------|---------|
| Aktivitäts-Feed (zentral) | `/historie` | globaler Pipedrive-Stil-Zeitstrahl über alles |
| Historie-Reiter (dezentral) | bei Objekt/Einheit/Mieter/Vorgang/Kontakt | Zeitstrahl dieser Entität |
| Audit-Log (Compliance) | `/einstellungen/audit` | nüchterne Tabelle, nur berechtigte Rollen |

## 2. Prozess: Aktivität protokollieren (Module → Historie)

1. Ein Modul-Vorgang passiert (Zahlung verbucht, Mahnung raus, Nachricht gesendet, Schaden
   gemeldet, Vertrag angelegt, Schloss-Code vergeben …).
2. Das Modul ruft `protokolliere(typ, modul, titel, payload, primaerBezug)`.
3. `protokolliere.ts` schreibt `aktivitaeten` + setzt den Primär-Bezug, leitet über die Hierarchie
   die abgeleiteten Bezüge ab (Mieter→Einheit→Objekt) → `aktivitaet_bezug`.
4. Feed (zentral + dezentral) zeigt die Aktivität sofort.

## 3. Prozess: Audit-Log (automatisch, DB-Trigger)

1. Bei INSERT/UPDATE/DELETE auf einer Whitelist-Tabelle feuert `audit_trigger()`.
2. Schreibt alt/neu-JSONB + geänderte Felder + Akteur (aus `wimus.akteur_id`-Session-Var) +
   Zeitpunkt nach `audit_log`. Lückenlos, auch bei direkten DB-Changes (dann akteur=direkt).
3. **App setzt den Akteur:** Server-Client/API-Route setzt je Request `SET LOCAL
   wimus.akteur_id='<uuid>'` → der Trigger kennt den Verursacher.

## 4. Prozess: Zentraler Feed (Pipedrive-Timeline)

1. `/historie` lädt die jüngsten Aktivitäten (Limit + Lazy-Load), neueste oben.
2. Zeit-Gruppierung (Heute/Gestern/Letzte Woche/Datum), Karten mit Typ-Icon + Farbe.
3. Filter nach Modul/Typ (nur Finanzen, nur Kommunikation …). Karte expandierbar → payload-Detail.
4. RLS: nur Aktivitäten des eigenen Mandanten.

## 5. Prozess: Dezentraler Reiter „Historie"

1. Auf Detailseite (Objekt/Einheit/Mieter/Vorgang/Kontakt) Reiter „Historie".
2. Zeigt Aktivitäten mit Bezug auf diese Entität (über `aktivitaet_bezug`).
3. **Ebenen-Umschalter** „nur diese Ebene / inkl. untergeordnete" (z.B. Objekt zeigt auch alle
   Aktivitäten seiner Einheiten/Mieter) — Verwalter-Sicht. Datenschutz wie 0007.
4. Dieselbe Timeline-Komponente wie zentral, nur vorgefiltert.

## 6. Prozess: Audit-Ansicht (Compliance)

1. `/einstellungen/audit` — nüchterne Tabelle (Tabelle/Operation/Datensatz/Akteur/Zeit), KEIN
   Timeline-Schmuck. Für Forensik/DSGVO-Auskunft.
2. Filter nach Tabelle/Datensatz/Akteur/Zeitraum. Diff alt→neu (Roadmap: visueller Diff-Viewer).
3. Nur berechtigte Rollen (Verwalter/Admin).

## 7. Lieferanten-Integration (welche Module rufen protokolliere)

| Modul | Beispiel-Aktivität |
|-------|--------------------|
| FiBu (0002) | zahlung_eingegangen, mahnung_versandt, beleg_verbucht |
| Kommunikation (0007) | nachricht_gesendet, nachricht_empfangen |
| Automation (0005) | automation_ausgeloest (Run → Aktivität) |
| Belegung (0001) | sperre_gesetzt, buchung_angelegt |
| Verträge (0001) | vertrag_angelegt, vertrag_beendet |
| Zugang (TTLock) | zugang_vergeben, zugang_entzogen |

> Integration schrittweise — beim Bau die wichtigsten Lieferanten zuerst verdrahten, Rest im
> Report als Folge-Punkte. Module liefern, 0009 sammelt/zeigt.

## 8. Fehler-/Randverhalten
- `protokolliere()` darf den auslösenden Vorgang NIE blockieren (Fehler beim Logging → Vorgang
  läuft trotzdem; Logging-Fehler separat behandeln).
- Audit-Trigger: bei Trigger-Fehler darf die eigentliche DB-Operation nicht scheitern → robust
  (z.B. EXCEPTION-Handling im Trigger, Logging-Fehler schlucken statt Transaktion abbrechen).
- Massen-Updates (Migrationen) können viele Audit-Zeilen erzeugen → ggf. Trigger temporär aus
  (session_replication_role) bei großen Daten-Migrationen.

## 9. Tests (Soll)
- Unit: protokolliere (Bezug-Ableitung Hierarchie), feed-Filter/Ranking, changed_keys.
- Trigger-Test: INSERT/UPDATE/DELETE auf Whitelist-Tabelle → korrekter audit_log-Eintrag
  (alt/neu/Felder/Akteur).
- RLS-Test: Nutzer A sieht keine Aktivitäten/Audit von Mandant B; normaler Nutzer kein Audit-Log.
- Integration: Modul-Vorgang → Aktivität erscheint zentral + dezentral (richtige Bezüge).

## 10. Offen → Claude Code (Report)
1. Whitelist real (Tabellen + mandant_id/id-Vorhandensein).
2. Session-Var-Akteur real setzbar?
3. Welche Lieferanten zuerst verdrahten (Vorschlag: FiBu + Kommunikation + Verträge).
4. Retention-Default Audit (DSGVO).
