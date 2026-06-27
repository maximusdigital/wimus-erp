---
gehoert_zu: 0004
dokument: Tests
geaendert: 2026-06-26
---

# 0004 — Tests

> Version & Status des Moduls stehen in `004_ops_000_konzept.md`.
> Test-Stack siehe Kern `001_erp_600_tests.md`.

## Priorität 1 — Vorgangslogik

- Status-Flow offen→beauftragt→in_arbeit→erledigt→abgeschlossen; Rücksprung nur mit Audit.
- Notfall-Priorität → Eskalation getriggert.
- Jeder Statuswechsel erzeugt `vorgang_verlauf`-Eintrag (Akteur+Zeit).
- Abgeschlossener Vorgang → nicht editierbar (Status-Sperre).
- Mieterverschulden → Forderung (Kern) verknüpft.

## Priorität 1 — KZV-Reinigung

- Beds24 Check-out → Reinigungsauftrag erzeugt, naechster_checkin gesetzt (Zeitdruck).
- Schaden in Reinigung → Vorgang, korrekt der letzten Buchung (beds24_buchung_id) zugeordnet.
- Schadensstaffel: <50€ Kaution, 50–300€ Plattform, >300€ manuell — richtige Route.
- Abschluss erfordert Vorher- + Nachher-Fotos (Pflicht).
- Inventarcheck gegen `inventar_positionen` (fehlend/kaputt erkannt).

## Priorität 1 — Übergabe LZV

- Protokoll Auszug referenziert Einzugsprotokoll (vergleich_protokoll_id).
- Abgleich: Position bei Auszug „technisch", bei Einzug „mangelfrei" → Schadensvorschlag.
- Pflichtfoto-Position ohne Foto → Protokoll nicht abschließbar.
- Abgeschlossenes Protokoll → Kautionsabrechnung (Kern) anstoßbar.

## Priorität 1 — Wartung/Fristen

- Wartungsintervall → Kern-Frist → Vorgang zum Fälligkeitsdatum.
- wartungsobjekte.naechste_pruefung korrekt aus letzte_pruefung + Intervall.

## DB (pgTAP)

- RLS: Mandant-Isolation auf allen 004-Tabellen.
- Reinigungskraft sieht nur eigene Aufträge (Akteur-Sichtbarkeit).
- UNIQUE: ein offener Reinigungsauftrag je Buchung+Einheit.

## E2E (Happy Path)

- Schadensmeldung → Vorgang → Handwerker beauftragen → erledigt → Rechnung → abschließen.
- Check-out → Reinigung mit Fotos + Inventar → Schaden → abschließen.
