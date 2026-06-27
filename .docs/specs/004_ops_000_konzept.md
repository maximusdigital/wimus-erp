---
id: 0004
titel: Betrieb (Vorgänge, Übergaben, Reinigung, Wartung)
status: in_arbeit
version: 0.1.0
modul: ops
erstellt: 2026-06-26
geaendert: 2026-06-26
abhaengt_von: [0001]
---

# 0004 — Betrieb (Vorgänge, Übergaben, Reinigung, Wartung)

## Worum geht's

Der operative Alltag der Immobilienverwaltung: alles, was im laufenden Verhältnis an
Aufgaben, Schäden, Reinigung, Wartung und Koordination mit Dritten anfällt. Bündelt vier
eng verzahnte Bereiche, die alle über das gemeinsame Vorgangs-Konzept laufen:

1. **Vorgangsmanagement** — Schäden, Reparaturen, Anfragen, Beschwerden; Priorität, Status-Flow,
   Kostenträger, Aktenzeichen, Foto-/Dokumentanhang, Verlauf.
2. **Übergaben** — formelle Protokolle (LZV/WG) mit Bildaufnahme + Einzug-Auszug-Abgleich;
   reinigungsbasierte Zustandsprüfung (KZV) bei jedem Check-out.
3. **Reinigung/Housekeeping** — KZV-Turnaround nach Check-out, Reinigungspläne, Wäscheservice,
   Vorher/Nachher-Fotos, Inventarcheck.
4. **Wartung/Facility** — wiederkehrende Prüfpflichten (Heizung, Rauchmelder, Legionellen, TÜV,
   E-Check), Müllabfuhr-Termine, Winterdienst, Gartenpflege, Hausreinigung.

Migriert aus den Bestands-Konzepten (P14 Vorgangsmanagement, P15 Einsatzplanung, P24
Dienstleister, P25 Compliance, P31 Wartung, P34 Notfall, Übergabeprozesse Kap. 6).

Baut auf Kern (0001): Vorgänge, Fristen, Forderungen/Kaution, Akteure, Channel-System, DMS.
Nutzt diese, erfindet sie nicht neu.

## Steht (gebaut & läuft)

- Kern-Fundament vorhanden: `vorgaenge` (mit `massnahme_typ`), Fristen (Wartungstypen),
  Forderungen (Schadenstyp + Foto-Referenz), Akteure-Modell, Channel-Routing.
- KZV-Buchungsfluss: Beds24-Webhook → n8n → NocoDB/amoCRM (liefert Check-out-Termine als
  Reinigungs-Trigger).

## In Arbeit

- Grobspec (dieses Modul) — Migration aus Bestands-Konzept.

## Ideen / als Nächstes

- Agent 5 (Vorgangs-Agent): Schadensmeldung → Priorität → Handwerker vorschlagen (P24) →
  Auftrag vorbereiten → Preisspiegel → Rechnung prüfen.
- Mobile PWA für Reinigungskräfte/Hausmeister (offline-fähig, Kamera, Tagesplan).
- KI-Schadenskategorisierung + Kostenschätzung aus Foto (Claude Vision).
- Einzug-Auszug-Foto-Abgleich automatisiert (Schadensermittlung).
- Einsatzplanung als Plantafel (Drag&Drop), CalDAV-Sync.

## Entscheidungen (warum es so ist)

- 2026-06-26: **Ein Betriebs-Modul statt Aufteilung.** Vorgänge, Übergaben, Reinigung,
  Wartung laufen alle über dasselbe Vorgangs-Konzept und teilen Akteure/Fristen/DMS —
  Zusammenfassung reduziert Doppelstruktur.
- 2026-06-26: **Zwei getrennte Übergabe-Logiken** (aus Realbetrieb): LZV/WG = formelles
  Protokoll mit Unterschrift + Einzug-Auszug-Abgleich (rechtsverbindlich, Basis Kaution);
  KZV = reinigungsbasierte Zustandsprüfung ohne Gast-Unterschrift, Schaden→Vorgang→letzter
  Buchung zugeordnet.
- 2026-06-26: **Vorgang ist die zentrale Einheit.** Housekeeping/Facility/Dritt-Kommunikation/
  Mieter-Anliegen sind alles Vorgangstypen, kein getrenntes System.
- 2026-06-26: **Gestaffelte KZV-Schadensabwicklung** (aus Praxis): Bagatell <50€ aus
  Kaution/Reinigungspauschale; mittel 50–300€ über Plattform-Resolution; groß >300€ manuell
  + Versicherungsprüfung.
- 2026-06-26: **Wiederkehrende Wartung über Kern-Fristen**, nicht eigene Mechanik — Fristen
  erzeugen Vorgänge (Heizung 1J, Rauchmelder 1J, Feuerlöscher 2J, Legionellen 3J, TÜV 1J,
  E-Check 4J, Gas 12J).

## Offene Punkte

- OP-1: Dienstleister-Stammdaten (P24) — eigene Tabelle in 004 oder als `organisationen`-Typ
  (Kern 0001)? Tendenz: `organisationen` mit typ=dienstleister + Bewertungen/Preislisten in 004.
- OP-2: Einsatzplanung (P15) — eigener Abschnitt in 004 oder später eigenes Modul? Erstmal hier.
- OP-3: Mobile PWA — eigener UI-Stack (offline) vs. responsive Web; Tech-Entscheidung offen.
- OP-4: Foto-Ablage — Paperless (Bilder/PDF) vs. Nextcloud (Videos); Übergabefotos wohin?
- OP-5: Müllabfuhr-Termine — Quelle (Gemeinde-Kalender-Import) je Standort.
- OP-6: Schaden→Forderung-Verknüpfung (Kern): Mieterverschulden → Forderung; Abgleich mit Kaution.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 0.1.0 | 2026-06-26 | in_arbeit | Grobspec migriert aus Bestand: Vorgänge, Übergaben (LZV/KZV), Reinigung, Wartung, Einsatzplanung |

## Änderungshistorie

> Laufendes Protokoll aller Änderungen am Modul (neueste oben). Vorgang ≤ 100 Zeichen.

| Datum/Zeit | Vorgang | Betroffen |
|------------|---------|-----------|
| 2026-06-26 16:00 | Grobspec 004 migriert aus Bestand (Vorgänge/Übergaben/Reinigung/Wartung) | alle |
