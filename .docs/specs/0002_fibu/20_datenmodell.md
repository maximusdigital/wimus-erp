---
gehoert_zu: 0002
dokument: Datenmodell
geaendert: 2026-06-25
---

# 0002 — Datenmodell

> Version & Status des Moduls stehen in `00_konzept.md`.
> Schema `wimus`. Baut auf Kern-Tabellen (0001) auf, insb. `ocr_verarbeitungen`,
> `objekte`/`einheiten`, `kontakte`. Konvention: PK UUID DEFAULT gen_random_uuid(), FK.
> Grobentwurf — Feldlisten werden zur Feinspec verdichtet; DDL als Migration (download-only).

## Organisations- & Steuerstruktur

### gesellschafter
mandant_id FK, name, typ ENUM (natuerliche_person/juristische_person), steuerliche_id,
adresse, aktiv BOOL. Einheitenunabhängig; kann an mehreren Einheiten beteiligt sein.

### einheiten (Buchungskreis — erweitert bestehende Firmen-/Mandantenebene)
> Hinweis: ggf. bestehende `firmen`/`mandanten` erweitern statt neu anlegen.
rechtsform_typ ENUM (kapitalgesellschaft/personengesellschaft/privat), besteuerungsart
ENUM (bilanz/euer/ueberschuss), steuernummer, kontenrahmen_ref, datev_berater_nr,
datev_mandant_nr, bankkonten (FK/JSON), aktiv BOOL.

### beteiligungen
gesellschafter_id FK, einheit_id FK, quote DECIMAL(7,4), gueltig_ab DATE, gueltig_bis DATE
(NULL=aktuell). Basis für periodengenaue Ergebnisverteilung.

### feststellungen (Controlling-Vorschau, nicht steuerverbindlich)
einheit_id FK, periode_von/bis DATE, ermitteltes_ergebnis DECIMAL(14,2),
verteilung JSONB (je gesellschafter_id: anteil_quote, anteil_betrag, zeitanteilig),
erstellt_am, akteur_id FK.

## Kontenrahmen & Regeln

### konten / kontenrahmen
einheit_id FK (oder workspace-vererbt), kontonummer, bezeichnung, kontoart ENUM
(soll/haben/automatik), skr_basis ENUM (skr03/skr04/euer), ust_automatik. Pro
rechtsform_typ unterschiedlich (GmbH-SKR ≠ EÜR-Konten).

### kontierungsregeln
scope ENUM (workspace/einheit), einheit_id FK NULL, gewerk/leistung-Match,
soll_konto, haben_logik (k1→bank), ust_satz/steuerschluessel, prioritaet, aktiv BOOL.
Workspace = Default, einheit = Override. In ERP-UI pflegbar.

### lieferanten / kreditoren
einheit_id FK, name, alias[], ustid, iban, standard_gewerk, standard_konto,
fuzzy_match_keys. Aliasse (DM→Reinigung, LIDL→Deko etc.).

## Belege & Buchungen

### belege (versioniert, GoBD)
einheit_id FK (Pflicht), ocr_verarbeitung_id FK → 0001.ocr_verarbeitungen, hash UNIQUE
(Idempotenz), original_ref (unveränderbar), kanal ENUM (email/gdrive/upload/whatsapp),
ist_erechnung BOOL, klasse ENUM (rechnung/abrechnung/kassenbeleg/tankbeleg/mahnwesen/
zahlungsbeleg/gutschrift/abschlagsplan/vertragsunterlage/sonstiges), belegnummer, belegdatum
DATE, faelligkeitsdatum DATE, lieferant_id FK, netto/brutto DECIMAL(12,2), ust_satz/
ust_betrag, k1, k2, positionen JSONB (optional), confidence_ocr/confidence_extraktion/
confidence_kontierung DECIMAL(3,2), review_flag BOOL, status ENUM (siehe Status-Maschine),
version INT, vorgaenger_beleg_id FK (Korrektur = neue Version).

### buchungen (Eingang)
beleg_id FK, einheit_id FK (Pflicht), datum DATE, soll_konto, haben_konto, betrag_brutto,
ust_schluessel, k1 (Pflicht), k2, buchungstext (max 60), buchungs_id_extern (stabil, für
TaxPool-Dublettenerkennung), akteur_id FK, akteur_typ ENUM (mensch/ki), gebucht_am
TIMESTAMPTZ, exportiert_am TIMESTAMPTZ.

### korrekturen (lernender Loop)
buchung_id FK, feld, alt_wert, neu_wert, akteur_id FK, am TIMESTAMPTZ. Häufung →
Kontierungsregel-Vorschlag.

## Auswertungs-Scopes (Konsolidierung)

### auswertungs_scopes
name, einheiten_set UUID[], k1_set TEXT[] (oder Tag-Filter), zeitraum_typ, optionen JSONB
(z.B. innenumsaetze_eliminieren BOOL), gespeichert_von FK. Presets („Holding gesamt", „nur
Immobilien", „ALFA CAMPUS", „Privatobjekte").

### objekt_tags (Gruppierung für horizontale Achse)
objekt_id FK (= K1), tag_typ ENUM (nutzungsart/marke/region), wert. Ermöglicht „alle
Wohn-Objekte" ohne Einzelauswahl.

### reporting_taxonomie (gemeinsames Raster)
position_code, bezeichnung, mapping JSONB (skr03-Konten ↔ euer-Positionen → neutrale
Berichtsposition). Vereinheitlicht Bilanz- und EÜR-Konten für die Aggregation.

## Status-Maschine (Werte)

eingegangen, einheit_zugeordnet, ocr_ok, extrahiert, validiert, freigabe_offen, gebucht,
exportiert, fehler, dublette, abgelehnt. Übergänge protokolliert (Akteur + Timestamp).

## RLS

belege, buchungen, konten strikt nach `einheit_id` row-level getrennt. Akteur kann für
mehrere Einheiten berechtigt sein; Daten bleiben getrennt (externer Beraterblick auf
einzelne Einheit möglich).
