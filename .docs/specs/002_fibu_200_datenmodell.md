---
gehoert_zu: 0002
dokument: Datenmodell
geaendert: 2026-06-27
---

# 0002 — Datenmodell

> Version & Status des Moduls stehen in `002_fibu_000_konzept.md`.
> Schema `wimus`. Baut auf Kern-Tabellen (0001) auf, insb. `ocr_verarbeitungen`,
> `objekte`/`einheiten`, `kontakte`. Konvention: PK UUID DEFAULT gen_random_uuid(), FK.
> Grobentwurf — Feldlisten werden zur Feinspec verdichtet; DDL als Migration (download-only).

## Implementierungsstand (real, Stand 2026-06-26)

Maßgeblich gegenüber dem Grobentwurf unten — Code = Wahrheit:

- **Buchungskreis = `firmen`** (FK `firma_id`), KEINE neue `einheiten`-Tabelle. Die
  Steuermerkmale (`rechtsform_typ`, `besteuerungsart`, `kontenrahmen_ref`) wurden additiv an
  `wimus.firmen` ergänzt (Migration 010). `steuernummer`/`ust_id`/`datev_*`/`wirtschaftsjahr_start`
  waren bereits an `firmen` vorhanden. Wo unten „einheit_id" steht, ist real `firma_id` gemeint.
- **Reale Tabellennamen:** `fibu_buchungen`, `fibu_konten`, `fibu_korrekturen`.
  Grund: `wimus.buchungen` ist bereits durch die **KZV-Reservierungen** belegt (gast/checkin/
  beds24/pin) — Namenskollision. `belege` heißt wie spezifiziert.
- **RLS:** `mandant_isolation` über `mandant_id` + `public.user_mandanten` (nicht „nach
  einheit_id"). Jede FiBu-Tabelle trägt `mandant_id` (RLS) + `firma_id` (Buchungskreis).
  Kind-Tabellen ohne `mandant_id` (`fibu_korrekturen`) isolieren über die Elterntabelle.
- **Gebaut (Migration 010/011):** `gesellschafter`, `beteiligungen`, `fibu_konten`,
  `kontierungsregeln`, `lieferanten`, `belege`, `fibu_buchungen`, `fibu_korrekturen`.
- **Gebaut (Migration 015, 2026-06-27):** `feststellungen` (jetzt persistierbar, nicht nur
  Live-Vorschau), `auswertungs_scopes`, `objekt_tags`, `reporting_taxonomie` — je mit RLS.
  Buchungskreis als `firma_id` (statt „einheit_id" der Grobspec). Schreib-/Lese-Code in der
  App folgt schrittweise (Tabellen stehen bereit).

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
> Status: **als Tabelle gebaut (Migration 015)** — Persistenz der Vorschau möglich; die
> Live-Berechnung (`/fibu/feststellung` + `ergebnisverteilung`) bleibt zusätzlich.
> Buchungskreis = `firma_id` (nicht `einheit_id`).
einheit_id FK, periode_von/bis DATE, ermitteltes_ergebnis DECIMAL(14,2),
verteilung JSONB (je gesellschafter_id: anteil_quote, anteil_betrag, zeitanteilig),
erstellt_am, akteur_id FK.

## Kontenrahmen & Regeln

### konten / kontenrahmen  → real `fibu_konten`
mandant_id FK, firma_id FK (NULL=alle), kontonummer, bezeichnung, kontoart ENUM
(soll/haben/automatik), skr_basis ENUM (skr03/skr04/euer), ust_automatik. Pro
rechtsform_typ unterschiedlich (GmbH-SKR ≠ EÜR-Konten).

### kontierungsregeln
mandant_id FK, scope ENUM (workspace/einheit), firma_id FK NULL (real; „einheit"), gewerk/leistung-Match (Feld `match`),
soll_konto, haben_logik (k1→bank), ust_satz/steuerschluessel, prioritaet, aktiv BOOL.
Workspace = Default, einheit = Override. In ERP-UI pflegbar.

### lieferanten / kreditoren
mandant_id FK, firma_id FK NULL, name, alias[] (TEXT[]), ustid, iban, standard_gewerk,
standard_konto. Umgesetzt (Migration 010): Fuzzy-Match läuft über `alias[]` —
kein separates `fuzzy_match_keys`-Feld. Aliasse (DM→Reinigung, LIDL→Deko etc.),
Matching in `lib/fibu/lieferant-match.ts`.

## Belege & Buchungen

### belege (versioniert, GoBD)
> Real zusätzlich denormalisiert (aus der Pipeline): `lieferant_name`, `lieferant_ustid`,
> `iban`, `gewerk`, `soll_konto`, `steuerschluessel`, `review_gruende TEXT[]`. `klasse` real
> Freitext (kein ENUM/CHECK). `firma_id` (Buchungskreis) nullable; `mandant_id` Pflicht (RLS).
> `ocr_verarbeitung_id` referenzlose UUID (ocr_verarbeitungen separat).
mandant_id FK (Pflicht), firma_id FK, ocr_verarbeitung_id, hash UNIQUE
(Idempotenz), original_ref (unveränderbar), kanal ENUM (email/gdrive/upload/whatsapp),
ist_erechnung BOOL, klasse ENUM (rechnung/abrechnung/kassenbeleg/tankbeleg/mahnwesen/
zahlungsbeleg/gutschrift/abschlagsplan/vertragsunterlage/sonstiges), belegnummer, belegdatum
DATE, faelligkeitsdatum DATE, lieferant_id FK, netto/brutto DECIMAL(12,2), ust_satz/
ust_betrag, k1, k2, positionen JSONB (optional), confidence_ocr/confidence_extraktion/
confidence_kontierung DECIMAL(3,2), review_flag BOOL, status ENUM (siehe Status-Maschine),
version INT, vorgaenger_beleg_id FK (Korrektur = neue Version).

### buchungen (Eingang)  → real `fibu_buchungen` (NICHT `buchungen` = KZV!)
beleg_id FK, mandant_id FK (Pflicht), firma_id FK, datum DATE, soll_konto, haben_konto, betrag_brutto,
ust_schluessel, k1 (Pflicht), k2, buchungstext (max 60), buchungs_id_extern (stabil, für
TaxPool-Dublettenerkennung), akteur_id FK, akteur_typ ENUM (mensch/ki), gebucht_am
TIMESTAMPTZ, exportiert_am TIMESTAMPTZ.

### korrekturen (lernender Loop)  → real `fibu_korrekturen`
mandant_id FK, buchung_id FK (→ fibu_buchungen), beleg_id FK, feld, alt_wert, neu_wert,
akteur_id, am TIMESTAMPTZ. Häufung → Kontierungsregel-Vorschlag.
> Tabelle gebaut; Schreiben/Auswerten (Regelvorschlag) im Code noch offen.

## Auswertungs-Scopes (Konsolidierung)

> Status: **gebaut (Migration 015)** — Tabellen + RLS stehen. `auswertungs_scopes` genutzt
> (Presets in `/fibu/konsolidierung`). `objekt_tags` genutzt (Verwaltung + Gruppierung in
> `/fibu/objekt-tags`). `reporting_taxonomie` genutzt (`/fibu/reporting-taxonomie` +
> GuV-Umschalter Konten↔Positionen; mapping JSONB = `{ art, konten[] }`, Konto-Präfix-Match).

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

> Real umgesetzt als `mandant_isolation` (FOR ALL TO authenticated) über `mandant_id` +
> `public.user_mandanten` — analog zum gesamten wimus-Schema. Tabellen ohne `mandant_id`
> (`fibu_korrekturen`) isolieren über die Elterntabelle. Die unten beschriebene Trennung
> „nach einheit_id" ist konzeptionell; technisch trägt jede Zeile `firma_id` (Buchungskreis)
> zusätzlich zur `mandant_id`.

belege, fibu_buchungen, fibu_konten strikt mandanten-/firmengetrennt. Akteur kann für
mehrere Firmen berechtigt sein; Daten bleiben getrennt (externer Beraterblick auf
einzelne Firma möglich).

## Datenintegrität (FiBu-spezifisch)

> Basis: Kern, Abschnitt „Datenintegrität" in `001_erp_200_datenmodell.md`.
> Hier nur FiBu-Spezifika.

- **Block (DB-UNIQUE):** `belege.hash` (exakt gleiche Datei); `buchungen.buchungs_id_extern`
  (TaxPool-Dublettenerkennung); Zahlungseingänge `finapi_transaktion_id`.
- **Warnung (UI-Vorabprüfung):** Lieferant + Belegnr. + Betrag + Datum (Korrektur/
  Zweitausfertigung möglich); Kreditoren via USt-ID/IBAN/Name-Fuzzy.
- **Status-Sperre (GoBD):** gebuchte Buchung → nur Storno; exportierter Beleg → nur
  Archivieren + Neuversion (`version`/`vorgaenger_beleg_id`), nie Überschreiben.
- **Feld-Edit-Stufen:** Kontierungs-Konto/K1/K2 im Freigabe-Cockpit = `inline`;
  Betrag/Belegnummer = `detail`; gebuchte/exportierte Felder = `gesperrt`.
- **Duplizieren:** beim Kopieren NICHT mitnehmen: Belegnummer, hash, buchungs_id_extern,
  externe IDs.
