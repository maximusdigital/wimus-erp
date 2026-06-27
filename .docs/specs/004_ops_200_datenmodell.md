---
gehoert_zu: 0004
dokument: Datenmodell
geaendert: 2026-06-26
---

# 0004 — Datenmodell

> Version & Status des Moduls stehen in `004_ops_000_konzept.md`.
> Schema `wimus`. Erweitert Kern `vorgaenge`; verweist auf `forderungen`, `kautionen`,
> Akteure, `organisationen`, `objekte`/`einheiten`, `mietvertraege`, Beds24-Buchung.
> Konvention: PK UUID, FK. Grobentwurf.

## Vorgänge (Erweiterung Kern `vorgaenge`)

Kern hat `vorgaenge` mit `massnahme_typ`. Erweiterung für Betrieb:

### vorgaenge (ALTER / Felder)
typ ENUM (housekeeping/facility/dritt_kommunikation/mieter_anliegen/uebergabe), unter_typ
VARCHAR(50) (reinigung_standard/reinigung_end/reparatur/wartung/muellabfuhr/winterdienst/
schadensmeldung/beschwerde/…), prioritaet ENUM (notfall/hoch/normal/niedrig), status ENUM
(offen/beauftragt/in_arbeit/erledigt/abgeschlossen), objekt_id FK, einheit_id FK NULL,
mietvertrag_id FK NULL, beds24_buchung_id VARCHAR NULL (KZV-Bezug), erstellt_von_akteur_id FK,
zugewiesen_akteur_id FK NULL (intern), zugewiesen_organisation_id FK NULL (extern/Handwerker),
faellig_am DATE, erledigt_am DATE, kosten_angebot DECIMAL(10,2), kosten_rechnung DECIMAL(10,2),
kostentraeger ENUM (mieter/eigentuemer/versicherung), aktenzeichen VARCHAR(50),
forderung_id FK NULL (bei Mieterverschulden → Kern), rechnung_beleg_id FK NULL (→ FiBu).

### vorgang_verlauf
vorgang_id FK, akteur_id FK, am TIMESTAMPTZ, ereignis VARCHAR(100) (Status-Wechsel/Kommentar/
Foto/Zuweisung), text TEXT, von_status/nach_status ENUM NULL. Audit-Timeline.

### vorgang_anhaenge
vorgang_id FK, dms_id VARCHAR (Paperless/Nextcloud), typ ENUM (foto/video/pdf/rechnung),
kategorie VARCHAR(50), aufgenommen_von_akteur_id FK, am TIMESTAMPTZ.

## Reinigung / Housekeeping

### reinigungsauftraege
mandant_id FK, objekt_id FK, einheit_id FK, vorgang_id FK, beds24_buchung_id VARCHAR NULL,
typ ENUM (standard/end/zwischen/wäsche), geplant_am TIMESTAMPTZ, reinigungskraft_akteur_id FK,
status ENUM (offen/in_arbeit/erledigt/problem), checkout_am TIMESTAMPTZ NULL,
naechster_checkin_am TIMESTAMPTZ NULL (Zeitdruck-Turnaround), inventar_ok BOOL,
schaden_gemeldet BOOL, vorher_fotos_ok BOOL, nachher_fotos_ok BOOL.

### reinigungsplaene
mandant_id FK, objekt_id FK, einheit_id FK NULL, intervall ENUM (nach_checkout/woechentlich/
14_taegig/monatlich), wochentag INT NULL, aufgabe TEXT, zustaendig_akteur_id FK, aktiv BOOL.

### inventar_positionen
mandant_id FK, einheit_id FK, bezeichnung, soll_menge INT, kategorie VARCHAR(50), aktiv BOOL.

> Inventarcheck bei Reinigung vergleicht Ist gegen `inventar_positionen` (aus MP02 Bestand).

## Übergaben

### uebergabeprotokolle
mandant_id FK, typ ENUM (einzug/auszug/wechsel), vertragsart ENUM (lzv/wg/kzv), objekt_id FK,
einheit_id FK, mietvertrag_id FK NULL, datum TIMESTAMPTZ, durchfuehrer_akteur_id FK,
anwesende JSONB, status ENUM (entwurf/abgeschlossen), vergleich_protokoll_id FK NULL
(Einzugsprotokoll bei Auszug), kautionsabrechnung_id FK NULL (→ Kern), unterschrift_neu BOOL,
unterschrift_alt BOOL, unterschrift_vermieter BOOL.

### uebergabe_zaehler
protokoll_id FK, zaehler_id FK (Kern), zaehlernummer VARCHAR, stand DECIMAL(12,3),
foto_dms_id VARCHAR (OCR-Quelle).

### uebergabe_schluessel
protokoll_id FK, art ENUM (zentral/wohnung/zimmer/briefkasten/garage/keller), anzahl INT,
id_kennung VARCHAR.

### uebergabe_positionen
protokoll_id FK, raum VARCHAR(50), position VARCHAR(50) (boden/wand/decke/fenster/sanitaer/
heizung/moeblierung/…), status ENUM (mangelfrei/optisch/technisch), beschreibung TEXT,
pflicht_foto BOOL, foto_dms_id VARCHAR NULL. Basis für Einzug-Auszug-Abgleich.

## Wartung / Facility (über Kern-Fristen)

> Wiederkehrende Wartung läuft über Kern `fristen` (frist_typ=wartung_*), die Vorgänge
> erzeugen. Hier nur Facility-Stammdaten, die Fristen nicht abdecken.

### wartungsobjekte
mandant_id FK, objekt_id FK, art ENUM (heizung/aufzug/rauchmelder/feuerloescher/legionellen/
tuev/e_check/gas/fahrzeug), intervall_jahre DECIMAL(4,2), letzte_pruefung DATE,
naechste_pruefung DATE, zustaendig_organisation_id FK NULL, frist_id FK (→ Kern).

### muellabfuhr_termine
mandant_id FK, objekt_id FK, tonne ENUM (rest/bio/papier/gelb), datum DATE,
zustaendig_akteur_id FK NULL (rausstellen), quelle VARCHAR (Gemeinde-Kalender).

## Einsatzplanung (P15)

### einsaetze
mandant_id FK, akteur_id FK (Mitarbeiter/Reinigungskraft/Hausmeister), vorgang_id FK NULL,
reinigungsauftrag_id FK NULL, datum DATE, von/bis TIME, ort_objekt_id FK, status ENUM
(geplant/laeuft/erledigt/abgesagt), notiz TEXT.

## Dienstleister-Zusatz (zu Kern `organisationen`)

### dienstleister_bewertungen
organisation_id FK (Kern, typ=dienstleister), vorgang_id FK NULL, bewertung INT (1–5),
kommentar TEXT, akteur_id FK, am TIMESTAMPTZ.

### dienstleister_preislisten
organisation_id FK, leistung VARCHAR(100), einheit VARCHAR(20), preis DECIMAL(10,2),
gueltig_ab DATE, rahmenvertrag BOOL.

## Datenintegrität (betriebsspezifisch)

> Basis: Kern `001_erp_200_datenmodell.md`.

- **Block:** ein offener Reinigungsauftrag je Buchung+Einheit (DB-UNIQUE).
- **Warnung:** Vorgang selber Schaden/Einheit/Zeitfenster über 2 Kanäle (Doppelmeldung).
- **Status-Sperre:** abgeschlossener Vorgang/abgeschlossenes Protokoll → nicht editierbar
  (nur reaktivieren mit Audit).
- **Versionieren:** Preislisten (gueltig_ab), Wartungsintervalle.
- **Abgleich-Pflicht:** Auszugsprotokoll referenziert Einzugsprotokoll (vergleich_protokoll_id).

## RLS

Alle Tabellen nach `mandant_id`. Akteur-Sichtbarkeit (Reinigungskraft sieht eigene Aufträge)
über Akteure-Modell.

## Migration

Vorgangstypen/Status aus Bestand seeden. Wartungsobjekte aus vorhandenen Fristen ableiten.
Inventarlisten aus MP02-Bestand. Dienstleister → `organisationen` (typ=dienstleister).
