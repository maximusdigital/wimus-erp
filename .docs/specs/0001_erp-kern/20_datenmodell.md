---
gehoert_zu: 0001
dokument: Datenmodell
geaendert: 2026-06-26
quelle: 20260624_WIMUS_IT_ERP_21_Datenmodell_Docs_V502.docx
---

# 0001 — Datenmodell

> Version & Status des Moduls stehen in `00_konzept.md`.
> Schema: `wimus` · ~130 Tabellen (nach V501+V502) · idempotente Migrationen 001–005.
> Konvention: PK = `UUID PRIMARY KEY DEFAULT gen_random_uuid()`, FK = Fremdschlüssel.

## Kern 1: Kostenverteilung

### bk_arten
mandant_id FK, bezeichnung VARCHAR(100), code VARCHAR(30), kategorie ENUM
(heizung/wasser/strom/gas/…), betrkv_nr VARCHAR(20) (§2 Nr.4a etc.), standard_schluessel
ENUM (kopfzahl/flaeche/…), umlagefaehig BOOL, hkvo_pflichtig BOOL, hkvo_verbrauch_pct
DECIMAL(5,2) default 70%, verbrauchsabhaengig BOOL, zaehlerpflicht BOOL.

### bk_berechnungslogiken
bk_art_id FK, eingangs_typ ENUM (zaehler/rechnung/pauschal/…), zaehler_einheit ENUM
(kwh/m3/mwh/liter/kg), umrechnung_aktiv BOOL, brennwert DECIMAL(8,4) kWh/m³ für Gas,
zustandszahl DECIMAL(6,4), heizwert DECIMAL(8,4) Öl/Pellets, preis_typ ENUM
(arbeitspreis/grund_plus_arbeit), prozent_von_art_id FK → bk_arten, prozent_wert
DECIMAL(5,2), gueltig_ab/bis DATE.

### brennwerte
versorgervertrag_id FK, gueltig_von/bis DATE, brennwert DECIMAL(8,4) kWh/m³,
zustandszahl DECIMAL(6,4), quelle VARCHAR(255) (Jahresabrechnung).

### abrechnungseinheiten
mandant_id FK, objekt_id FK, bezeichnung VARCHAR(100), typ ENUM
(wg/zaehlergruppe/heizkreis/bk_gruppe), standard_schluessel ENUM, aktiv BOOL.

### abrechnungseinheit_mitglieder
abrechnungseinheit_id FK, einheit_id FK, kontakt_id FK, mietvertrag_id FK, rolle ENUM
(hauptmieter/mitbewohner), schluessel_override ENUM, fester_anteil_pct DECIMAL(7,4),
intern_abgerechnet BOOL (KZV → 0 EUR), einzug_datum/auszug_datum DATE.

### kostenverteilung_positionen
mandant_id FK, objekt_id FK, bk_art_id FK, abrechnungseinheit_id FK, quelle ENUM
(zaehler/rechnung/weg_extern/pauschal/…), zaehler_id FK, zaehlerstand_von_id/bis_id FK,
verbrauch_einheit/verbrauch_kwh DECIMAL(12,4), preis_pro_einheit DECIMAL(10,6),
lieferant_id FK, leistung_von/bis DATE, betrag_netto/brutto DECIMAL(10,2), ust_prozent
DECIMAL(5,2), umlagefaehig BOOL, leerstand_anteil/intern_anteil DECIMAL(7,4),
intercompany BOOL, weg_abrechnung_id FK, ki_klassifiziert BOOL, abgerechnet BOOL,
paperless_id VARCHAR(100).

### bk_abrechnungen
mandant_id FK, objekt_id FK, einheit_id FK, mietvertrag_id FK, typ ENUM
(jahresabschluss/zwischen/sonderumlage), periode_von/bis DATE, vorauszahlung_gesamt
DECIMAL(10,2), kosten_gesamt DECIMAL(10,2), saldo DECIMAL(10,2) (+Nachz./-Guthaben),
nebenkostenspiegel JSONB, status ENUM (entwurf/versendet/bezahlt), paperless_id.

### weg_abrechnungen_extern
mandant_id FK, objekt_id FK, einheit_id FK, weg_hv_id FK → kontakte, abrechnungsjahr INT,
hausgeld_soll DECIMAL(10,2), abrechnungsergebnis DECIMAL(10,2), ruecklage_anteil
DECIMAL(10,2), paperless_id, in_bk_uebernommen BOOL.

### weg_abrechnungs_extern_positionen
weg_abrechnung_id FK, bezeichnung VARCHAR(255), betrag DECIMAL(10,2), umlagefaehig BOOL,
bk_art_id FK, ist_ruecklage/ist_verwaltungskosten/ist_instandhaltung BOOL, betrag_einheit
DECIMAL(10,2), ki_klassifiziert BOOL, manuell_geprueft BOOL.

## Kern 2: Fristenmanagement

### fristen
mandant_id FK, frist_typ ENUM (bk_anpassung/kuendigung/wartung/…), bezug_typ VARCHAR(30)
polymorphisch, bezug_id UUID, bezeichnung VARCHAR(255), start_datum/faellig_am DATE,
erinnerung_tage_vorher INT[] z.B. [30,14,7,1], eskalation_akteur_id FK, aktion_typ ENUM
(email/whatsapp/vorgang/zammad), vorlage_id FK, status ENUM (offen/erledigt/verpasst),
vorgang_id FK, automatisch_erstellt BOOL.

### bk_pauschalen_anpassungen
mietvertrag_id FK, alter_betrag/neuer_betrag DECIMAL(10,2), delta_pct DECIMAL(5,2),
ankuendigung_am/wirksam_ab DATE, email_gesendet_am TIMESTAMPTZ, vorgang_id FK, status
ENUM (vorgeschlagen/genehmigt/gesendet/wirksam), ausgeloest_durch ENUM (ki_auto/manuell),
hochrechnung_basis JSONB.

## Kern 3: Forderungsmanagement

### forderungen
mandant_id FK, mietvertrag_id FK, buchung_id FK, einheit_id FK, kontakt_id FK,
forderung_typ ENUM (miete/sachschaden/nutzungsausfall/…), schaden_typ ENUM
(boden/wand/sanitaer/…), schaden_beschreibung TEXT, schaden_festgestellt_am DATE,
schaden_fotos VARCHAR[] (paperless_ids), vorgang_id FK (1:n Schaden→Vorgang),
nutzungsausfall_von/bis DATE, nutzungsausfall_satz DECIMAL(10,2) (Tagesmiete),
§546a_anwendbar BOOL, versicherungsfall BOOL, versicherung_id FK, versicherung_betrag
DECIMAL(10,2), selbstbehalt DECIMAL(10,2), betrag DECIMAL(10,2), faellig_am DATE,
bezahlt_am/betrag, kaution_verrechnet BOOL, mahnstufe INT, status ENUM
(offen/teilbezahlt/bezahlt/…), finapi_transaktion_id VARCHAR(100).

### kautionsabrechnungen
mandant_id FK, mietvertrag_id FK, kaution_id FK, auszugsdatum DATE, kaution_betrag
DECIMAL(10,2), zinsen DECIMAL(10,2), kaution_gesamt DECIMAL(10,2), forderungen_gesamt
DECIMAL(10,2), saldo DECIMAL(10,2) (+Rückzahlung/-Nachforderung), status ENUM
(entwurf/versendet/bezahlt), frist_abrechnung DATE (6 Monate nach Auszug), paperless_id.

## Mietrecht & OCR

### mietpreiserhoehungen
mandant_id FK, mietvertrag_id FK, typ ENUM (vergleichsmiete/staffel/index/…),
alter_betrag/neuer_betrag DECIMAL(10,2), delta_pct DECIMAL(5,2), ankuendigung_am/
wirksam_ab DATE, gesetzliche_grundlage VARCHAR(30), zustimmung_mieter BOOL, zustimmung_am
DATE, modernisierungskosten DECIMAL(15,2), status ENUM (vorgeschlagen/wirksam/…).

### citytax_saetze
projekt_id FK, gemeinde VARCHAR(100), satz_pro_nacht DECIMAL(6,2), gueltig_ab/bis DATE
(NULL=aktuell), quelle VARCHAR(255), paperless_id.

### ocr_verarbeitungen
mandant_id FK, paperless_id VARCHAR(100), dokument_typ ENUM (mietvertrag/
eingangsrechnung/…), ocr_raw_md TEXT (Markdown Volltext), ocr_structured JSONB (Felder +
Confidence), ocr_confidence DECIMAL(3,2), ocr_seiten INT, ki_modell VARCHAR(50),
felder_extrahiert JSONB, felder_unsicher JSONB (< 0.80), felder_kritisch JSONB
(Betrag/Miete → immer prüfen), ziel_tabelle VARCHAR(50), ziel_id UUID, status ENUM
(ocr_fertig/extrahiert/geprueft/…), geprueft_von FK, paperless_md_id (_ocr.md Anhang),
paperless_json_id (_structured.json Anhang).

> Bezug FiBu (0002): `ocr_verarbeitungen` ist die gemeinsame OCR-Basis. Das FiBu-Modul
> nutzt diese Tabelle und ergänzt Beleg-/Buchungs-/Kontierungs-Tabellen darauf aufbauend.

### vertrags_parameter_definitionen
mandant_id FK, bezeichnung VARCHAR(100), code VARCHAR(50) UNIQUE, typ ENUM
(betrag/prozent/text/zahl/boolean), einheit VARCHAR(30), standard_wert VARCHAR(255),
gesetzliche_grundlage VARCHAR(50).

### portal_nachrichten
mandant_id FK, mietvertrag_id FK, kontakt_id FK, richtung ENUM (eingehend/ausgehend),
typ ENUM (abrechnung/mieterhoehung/…), betreff VARCHAR(255), inhalt TEXT, dokument_ids
VARCHAR[], gelesen_am TIMESTAMPTZ, vorgang_id FK, zammad_ticket_id VARCHAR(100).

## Externe Geschäftspartner (Organisationen)

> Voraussetzung für CRM-Pipelines (0003). Externe Firmen relational, mit mehreren
> Ansprechpartnern. **Wichtige Abgrenzung:** `organisationen` = AUSSEN (externe
> Geschäftspartner: Eigentümer-Firma, Makler, Bauträger, Lieferant). `firmen`/Mandanten =
> INNEN (eigene Buchungskreise). Bewusst getrennt — amoCRM vermischt beides in „Companies".

### organisationen
mandant_id FK, name VARCHAR(255), rechtsform VARCHAR(50), adresse (adresse-block-Felder:
strasse, hausnummer, plz, stadt, land), ustid VARCHAR(30) NULL, website VARCHAR(255) NULL,
typ ENUM (eigentuemer/makler/bautraeger/lieferant/interessent/sonstige), telefon VARCHAR(50)
NULL, email VARCHAR(255) NULL, notiz TEXT, aktiv BOOL.

> Eine Organisation kann n Ansprechpartner (Kontakte) haben (1:n über
> `kontakte.organisation_id`). Verknüpfung zu Deals/Leads erfolgt im CRM-Modul (0003).

## ALTER TABLE — Erweiterungen bestehender Tabellen (Migration 005)

- mietvertraege: bk_modell, bk_auto_check, bk_check_schwelle_pct, index_config JSONB,
  beds24_buchung_id, auto_erstellt, ust_pflichtig, citytax_betrag
- buchungen: mietvertrag_id FK, rechnung_id (Invoice Ninja)
- vorgaenge: massnahme_typ (instandhaltung/modernisierung/instandsetzung)
- zaehler: fernauslesbar BOOL, abrechnungseinheit_id FK
- kontakte: portal_aktiv BOOL, portal_aktiviert_am TIMESTAMPTZ, organisation_id FK NULL
  (→ organisationen; Person gehört zu externer Firma, für CRM-Pipelines 0003)
- projekte: citytax_satz deprecaten → citytax_saetze Tabelle verwenden

## Views & Funktionen (Migration 005)

- `v_kostenverteilung_anteile` – Anteilsberechnung je Einheit (flaeche/einheit/individuell)
- `v_faellige_fristen` – alle Fristen fällig in 30 Tagen (n8n täglich)
- `v_offene_forderungen` – alle offenen Forderungen mit Tage überfällig
- `kopfzahl_einheit(einheit_id, datum)` – Personen je Einheit zum Stichtag
- `kopfzahl_gruppe(gruppe_id, datum)` – Personen gesamt je Abrechnungseinheit

---

## Datenintegrität (Dubletten, Sperren, Propagation, Audit)

> **Umsetzungsstand (2026-06-26): Soll-Konvention, Code-Umsetzung teilweise (Backlog).**
> Real vorhanden: DB-UNIQUE-Constraints (z. B. `belege.hash`, `fibu_buchungen.buchungs_id_extern`)
> und RLS-Isolation. NICHT umgesetzt: UI-Vorabprüfung (Warn-Dubletten), generelle Status-/
> Concurrency-Sperren, Propagations-Verhalten und ein durchgängiges Audit-Log.
>
> Version & Status des Moduls stehen in `00_konzept.md`.
> Querschnitt-Thema: betrifft Datenmodell (Constraints/Trigger), Prozesse (Regeln/Audit)
> und UI (Sperranzeige, Konsequenz-Dialoge). Modulübergreifend verbindlich.
> Verallgemeinert drei vorhandene Kern-Muster: Lock-Mechanik (`konversation_locks`),
> Akteure-Modell (Audit-Träger), Versionierung mit `gueltig_ab` (citytax, brennwerte,
> beteiligungen).

## A. Dublettenprüfung

Zwei Mechaniken, immer kombiniert:

- **DB-Ebene (hart):** UNIQUE-Constraints für echte Eindeutigkeiten. Sicherung, die nie
  versagt (auch bei Race Conditions/Import). `ON CONFLICT DO NOTHING` für idempotente Importe.
- **UI-Ebene (weich, vor Submit):** Vorabprüfung, die mögliche (auch unscharfe) Dubletten
  findet und anzeigt: „Ähnlicher Eintrag existiert: … — Trotzdem anlegen / Bestehenden
  öffnen?". Fängt Fuzzy-Fälle, die ein Constraint nicht erkennt.

DB-Constraint allein → hässliche Fehler, keine Fuzzy-Erkennung. UI-Prüfung allein → durch
gleichzeitiges Speichern umgehbar. Beides zusammen = robust.

### Dubletten-Matrix je Entität

| Entität | Schlüssel | Verhalten | Mechanik |
|---------|-----------|-----------|----------|
| Belege (FiBu) | Datei-Hash | **Block** | DB UNIQUE(hash) |
| Belege (FiBu) | Lieferant + Belegnr. + Betrag + Datum | **Warnung** (Korrektur/Zweitausfertigung möglich) | UI-Vorabprüfung |
| Buchungen | Soll/Haben + Betrag + Datum + buchungs_id | **Warnung** | UI |
| Buchungen | buchungs_id_extern | **Block** | DB UNIQUE |
| Kontakte | Name+GebDatum / E-Mail / IBAN / USt-ID | **Warnung** (nie Block, echte Namensgleichheit) | UI Fuzzy-Match |
| Objekte | Adresse (Straße+Nr+PLZ, normalisiert) | **Warnung** | UI (adresse-block normalisiert) |
| Einheiten | Objekt + Bezeichnung | **Block** | DB UNIQUE(objekt_id,bezeichnung) |
| Verträge | Einheit + Mieter + überlappender Zeitraum | **Warnung** (außer WG) | UI/Trigger |
| Zähler | Zählernummer | **Block** | DB UNIQUE |
| Vorgänge/Schäden | Einheit + Schadenstyp + Zeitfenster | **Warnung** (Doppelmeldung über 2 Kanäle) | UI |
| Fristen | Bezug + Frist-Typ + Fälligkeit | **Block/Skip** (auto-Fristen idempotent) | DB/n8n |
| Kreditoren/Lieferanten | USt-ID / IBAN / Name-Fuzzy | **Warnung** + FiBu-Fuzzy-Match | UI |
| Zahlungseingänge (CAMT/finAPI) | finapi_transaktion_id | **Block** | DB UNIQUE |

> Fuzzy-Match nötig bei Kontakten/Lieferanten („Müller GmbH" = „Mueller GmbH" = „Müller
> G.m.b.H."). Verhindert, dass Forderungen auf mehrere Karteien derselben Person zerfallen.

## B. Bearbeitungssperren — drei getrennte Typen

Diese drei NICHT vermischen — sie werden unterschiedlich aufgelöst.

### B1. Beziehungs-Sperre (referenzielle Integrität)

Datensatz darf nicht frei geändert/gelöscht werden, WEIL andere darauf verweisen (aktiver
Mietvertrag, gebuchte Belege, laufende BK-Abrechnung an einer Einheit). Nicht „verboten",
sondern „kontrolliert, mit Konsequenz-Anzeige". Auflösung: siehe Propagations-Matrix (C).

### B2. Status-Sperre (GoBD/Unveränderbarkeit)

Datensatz in finalem Status darf gar nicht mehr editiert werden — nur storniert/neu
versioniert. Betrifft: gebuchte Buchung, versendete BK-Abrechnung/Mahnung, exportierter
Beleg, abgeschlossene Übergabe. Hart, gesetzlich. Auflösung: Storno (Buchung) /
Archivieren+Neuversion (Beleg), nie Überschreiben.

### B3. Concurrency-Lock (gleichzeitige Bearbeitung)

Zwei Akteure (Mensch + Mensch, oder Mensch + KI-Agent) wollen denselben Datensatz
gleichzeitig ändern. Übertragung der bestehenden `konversation_locks`-Mechanik auf
Datensätze: Lock mit Akteur + Timestamp. UI zeigt „wird gerade bearbeitet von X". Optimistic
Locking (Versionsfeld/`updated_at`-Vergleich) verhindert verlorenes Überschreiben:
zweiter Speichern erkennt veränderten Stand → Hinweis statt stilles Überschreiben.

## C. Propagation — vier Verhaltensweisen

Wird ein Feld geändert, an dem etwas hängt, gilt pro Feld pro Entität eine von vier
Regeln. Jede Änderung mit referenziellen Folgen ist **audit-pflichtig** (Akteur, alt/neu,
betroffene Bereiche).

| Verhalten | Bedeutung | Beispiel |
|-----------|-----------|----------|
| **Sperren** | Änderung nicht zulassen, solange Beziehung aktiv | Zählernummer mit hängenden Abrechnungen |
| **Propagieren** | Änderung zulassen, nachgelagerte Felder mitziehen + Audit | Lieferant umbenannt → in offenen Belegen aktualisieren |
| **Versionieren** | Änderung als neue Version ab Stichtag; alte Werte bleiben für historische Daten gültig | CityTax-Satz, Brennwert, Beteiligungsquote, Miethöhe |
| **Warnen** | Änderung zulassen, Konsequenzen vorher anzeigen | „betrifft 12 Datensätze in 3 Bereichen — fortfahren?" |

### Leitlinien zur Zuordnung

- **Stammdaten mit Zeitbezug** (Sätze, Preise, Quoten, Mieten) → fast immer **Versionieren**
  mit `gueltig_ab/bis`. Historische Buchungen/Abrechnungen behalten den damaligen Wert.
  (Vorhandenes Muster: citytax_saetze, brennwerte, beteiligungen.)
- **Identifizierende Felder** (Zählernummer, Einheit-Bezeichnung, Belegnummer) → **Sperren**,
  sobald referenziert.
- **Beschreibende Felder ohne Rechenfolge** (Name, Telefon, Notiz) → **Propagieren** oder frei.
- **Felder mit Rechenfolge in Abrechnungen** (Fläche, MEA, Umlageschlüssel) → **Warnen** +
  ggf. Versionieren (ab welcher Periode gilt der neue Wert?).

### Feld-Edit-Stufen (steuert auch Inline-Edit, s. Abschnitt „UI-Konventionen" in `40_design.md`)

Jedes Feld trägt eine Edit-Stufe:
- `inline` — frei, sofort in der Liste editierbar (Status, Tags, Notiz, K1 im Cockpit).
- `detail` — nur in Detailansicht, ggf. mit Warnung/Konsequenz-Dialog.
- `gesperrt` — nur via Storno/Versionierung (GoBD-final oder hart referenziert).

## D. Audit (GoBD-Pflicht)

- Jede Änderung mit referenziellen/finanziellen Folgen wird protokolliert: Akteur
  (Mensch/KI), Feld, alt-Wert, neu-Wert, Zeitpunkt, betroffene Bereiche/Datensätze.
- Träger ist das Akteure-Modell (0001). Anzeige als Timeline in der Detailansicht
  (Abschnitt „UI-Konventionen" in `40_design.md` Punkt 8).
- Unveränderbar: Audit-Einträge werden nie überschrieben/gelöscht.

## E. Umsetzungshinweise

- **DB-Trigger** für referenzielle Sperren und Propagation (nicht nur App-Logik —
  Race-sicher).
- **Optimistic Locking** über Versionsspalte/`updated_at` auf editierbaren Tabellen.
- **Konsequenz-Vorschau** als wiederverwendbare UI-Komponente („Diese Änderung betrifft …").
- **Versionierungs-Pattern** generalisieren: Tabellen mit zeitbezogenen Stammwerten nach dem
  `gueltig_ab/bis`-Muster (wie citytax_saetze) statt Überschreiben.

## F. Modul-Bezug

- FiBu (0002): Beleg-Hash-Block, Kreditoren-Fuzzy, Storno statt Löschen bei Buchungen,
  buchungs_id_extern-UNIQUE → verweisen auf dieses Dokument.
- Alle Module nutzen `<RowActions>` (`deletable`-Prop spiegelt B2/Storno-Logik) und die
  Feld-Edit-Stufen.
