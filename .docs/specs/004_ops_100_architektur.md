---
gehoert_zu: 0004
dokument: Architektur
geaendert: 2026-06-26
---

# 0004 — Architektur

> Version & Status des Moduls stehen in `004_ops_000_konzept.md`.
> Baut auf Kern (0001): Vorgänge, Fristen, Forderungen/Kaution, Akteure, Channel-System, DMS.

## Systemgrenzen

- **Eingang:** Schadensmeldung (Mieter/Gast via Channel), Reinigungs-Trigger (Beds24
  Check-out), Frist-Fälligkeit (Wartung), manuelle Vorgangsanlage, Übergabetermin.
- **Kern:** Vorgang als zentrale Einheit — Typ, Priorität, Status-Flow, Zuweisung, Kosten,
  Kostenträger, Fotos, Verlauf.
- **Ausgang:** Auftrag an Handwerker/Dienstleister (Channel), Forderung (bei
  Mieterverschulden → Kern), Kautionsabrechnung (Kern), DMS-Ablage (Fotos/Rechnungen).

## Vier Bereiche, ein Vorgangs-Konzept

| Bereich | Inhalt | Trigger |
|---------|--------|---------|
| Vorgangsmanagement | Schäden, Reparaturen, Anfragen, Beschwerden | Meldung / manuell |
| Übergaben | LZV formell (Protokoll+Unterschrift), KZV reinigungsbasiert | Ein-/Auszug / Check-out |
| Reinigung/Housekeeping | KZV-Turnaround, Reinigungspläne, Wäsche | Check-out / Plan |
| Wartung/Facility | Prüfpflichten, Müll, Winterdienst, Garten, Treppenhaus | Frist / Kalender |

## Vorgangstypen (aus Bestand P14)

- **Housekeeping:** Reinigung (Standard/End/Zwischen KZV), Wäscheservice, Aufbereitung
  zwischen KZV-Belegungen, Reinigungsplan je Objekt/Einheit.
- **Facility:** Reparaturen (klein/groß/Notfall), Wartungen, Müllabfuhr, Winterdienst,
  Gartenpflege, Hausreinigung/Treppenhaus.
- **Kommunikation Dritte:** Handwerker (Auftrag/Angebot/Abnahme/Rechnung), externe HV
  (WEG-Verwalter), Behörden, Versorger, Dienstleister.
- **Mieter-Vorgänge:** Schadensmeldung, Beschwerde, Anfrage, Kündigung.

## Datenfluss Handwerker (aus Bestand)

Schadensmeldung → Vorgang anlegen → Handwerker wählen (P24/`organisationen`) → Auftrag
erteilen (E-Mail/WhatsApp via Channel) → Termin → Zutritt koordinieren (TTLock temporär) →
Abnahme → Rechnung erfassen (→ FiBu 0002) → Zahlung → Vorgang schließen.

## Datenfluss KZV-Reinigung (aus Bestand)

Beds24 Check-out → Reinigungs-Vorgang → Mobile-App Reinigungskraft: Vorher-Fotos →
Inventarcheck (gegen Inventarliste) → Schaden? (Foto+Kategorie+Schwere → Vorgang, letzter
Buchung zugeordnet) → Reinigung → Nachher-Fotos → Schadensabwicklung gestaffelt.

## Übergabe LZV/WG (aus Bestand Kap. 6.1)

Protokoll (Typ Einzug/Auszug/Wechsel) → Zählerstände (OCR Claude Vision) → Schlüssel →
Rauchmelder-Test → Checkliste je Raum (Status mangelfrei/optisch/technisch) → Pflichtfotos
je Position → digitale Unterschrift → bei Auszug: Abgleich Einzug↔Auszug → Schadensermittlung
→ Kautionsabrechnung (Kern).

## Bezug zu Kern-Akteuren & Agenten

- Reinigungskräfte/Hausmeister/Handwerker = Akteure (0001), Aufträge tragen Akteur+Zeit.
- Agent 5 (Vorgangs-Agent): Priorität, Handwerker-Vorschlag, Auftrag, Rechnungsprüfung.
- Channel-System: Auftrag/Benachrichtigung über WhatsApp/E-Mail.
- Fristen (Kern): wiederkehrende Wartung erzeugt Vorgänge.

## Andocken, nicht duplizieren

- Vorgang-Basistabelle: Kern `vorgaenge` erweitern (Typen/Status), nicht neu bauen.
- Schaden mit Mieterverschulden → Kern `forderungen` (Schadenstyp, Foto-Referenz vorhanden).
- Dienstleister → Kern `organisationen` (typ=dienstleister) + 004-Zusatz (Bewertung/Preisliste).
