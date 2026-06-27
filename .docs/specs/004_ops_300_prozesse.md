---
gehoert_zu: 0004
dokument: Prozesse
geaendert: 2026-06-26
---

# 0004 — Prozesse

> Version & Status des Moduls stehen in `004_ops_000_konzept.md`.

## 1. Vorgang-Lebenszyklus (zentral)

Anlage (Meldung/manuell/Frist/Check-out) → Typ + Priorität setzen → Status-Flow:
**offen → beauftragt → in_arbeit → erledigt → abgeschlossen**. Jeder Schritt in
`vorgang_verlauf` (Akteur+Zeit). Notfall (Priorität) → Eskalationskette (P34).

## 2. Handwerker-/Reparatur-Prozess

1. Schadensmeldung → Vorgang (typ=facility/mieter_anliegen).
2. Priorität einschätzen (Agent 5 / manuell). Notfall → sofort eskalieren.
3. Handwerker/Dienstleister wählen (`organisationen` typ=dienstleister, Bewertung/Preisliste).
4. Auftrag erteilen via Channel (E-Mail/WhatsApp). Status=beauftragt.
5. Termin + Zutritt koordinieren (TTLock temporärer Code).
6. Abnahme → Status=erledigt. Rechnung erfassen → FiBu (0002).
7. Kostenträger klären (Mieter/Eigentümer/Versicherung). Mieterverschulden → Forderung (Kern).
8. Zahlung → Vorgang abschließen.

## 3. KZV-Reinigungs-Turnaround

1. Beds24 Check-out → Reinigungsauftrag (typ je nach Belegung), Zeitdruck aus
   naechster_checkin.
2. Reinigungskraft (Mobile): **Vorher-Fotos** → **Inventarcheck** (gegen `inventar_positionen`).
3. Schaden entdeckt? → Foto + Kategorie + Schwere → **Vorgang**, der **letzten Buchung**
   zugeordnet (beds24_buchung_id).
4. Reinigung durchführen → **Nachher-Fotos**.
5. **Schadensabwicklung gestaffelt:**
   - Bagatell <50€ → aus Kaution/Reinigungspauschale.
   - mittel 50–300€ → Plattform-Resolution-Center.
   - groß >300€ → manuell + Versicherungsprüfung.
6. KI: Schadenskategorisierung, Kostenschätzung, vorformulierte Gast-Nachricht.

## 4. Übergabe LZV/WG (formell)

1. Protokoll anlegen (Einzug/Auszug/Wechsel), Vertragsart lzv/wg.
2. Zählerstände (Foto → OCR Claude Vision), Schlüssel erfassen, Rauchmelder-Test.
3. Checkliste je Raum: Position + Status (mangelfrei/optisch/technisch) + **Pflichtfotos**.
4. Digitale Unterschrift (Neu-/Alt-Mieter/Vermieter) → Status=abgeschlossen, rechtsverbindlich.
5. **Bei Auszug:** automatischer **Abgleich Einzug↔Auszug** → Schäden, die bei Einzug nicht
   dokumentiert waren = potenziell Mieterverschulden → Schadensermittlung →
   **Kautionsabrechnung** (Kern, §259 BGB).

## 5. Übergabe KZV (reinigungsbasiert)

Kein Gast-Unterschriftsprozess. Zustandsprüfung = Teil jeder Reinigung (siehe 3). Schaden →
Vorgang → letzter Buchung. Keine formelle Übergabe.

## 6. Wartung / wiederkehrende Vorgänge

Kern-Fristen erzeugen Vorgänge nach Intervall: Heizung 1J, Rauchmelder 1J, Feuerlöscher 2J,
Legionellen 3J, Aufzug-TÜV 1J, E-Check 4J, Gas 12J. Müllabfuhr aus Gemeinde-Kalender (Tonne
rausstellen → Einsatz). Winterdienst (Streupflicht-Termine), Gartenpflege, Treppenhaus
(Reinigungsplan rotierend WG).

## 7. Einsatzplanung (P15)

Aufträge/Vorgänge auf Akteure (Mitarbeiter/Reinigungskräfte/Hausmeister) planen — Plantafel
Drag&Drop, Tagesplan mobil, Verfügbarkeit/Qualifikation (Schlüsselzugang/Fahrzeug). CalDAV-Sync.

## 8. Querbezug

- Vorgänge/Forderungen/Kaution/Akteure/Fristen/DMS: Kern (0001).
- Handwerkerrechnung → FiBu (0002). Dienstleister → `organisationen` (Kern).
- Schadensmeldung-Eingang → Posteingang-Agent (Agent 1) klassifiziert → Vorgang.
