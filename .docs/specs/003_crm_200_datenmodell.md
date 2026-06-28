---
gehoert_zu: 0003
dokument: Datenmodell
geaendert: 2026-06-28
---

# 0003 — Datenmodell

> Version & Status des Moduls stehen in `003_crm_000_konzept.md`.
> Schema `wimus`. Verweist auf Kern (0001): `firmen` (Mandant/Einheit), `kontakte`
> (Personen + externe Firmen relational), Akteure. Konvention: PK UUID, FK.
> Grundsatz: **nichts doppelt pflegen** — Deals verweisen auf Bestehendes, halten keinen
> eigenen Kontakt-/Firmenstamm.
>
> **Umsetzung (2026-06-27, Migration 013):** Die unten beschriebenen Tabellen heißen im
> Schema mit Prefix `crm_` — `crm_pipelines`, `crm_pipeline_stages`, `crm_verloren_gruende`,
> `crm_custom_field_definitionen`, `crm_deals`, `crm_deal_stage_historie`,
> `crm_deal_aktivitaeten`, `crm_leads`. Grund: Migration 002 belegt die bloßen Namen
> (`deals`/`pipelines`/`custom_field_definitionen`/…) mit ungenutzten v5-Stubs; das Prefix
> vermeidet Kollision (analog `fibu_buchungen`). Row-Audit-Zeitstempel heißen einheitlich
> `created_at`/`updated_at` (Kern-Konvention, Touch-Trigger), Domänen-Zeitfelder
> (`in_stage_seit`, `faellig_am`, `abgeschlossen_am`) bleiben wie beschrieben.
> `organisationen` + `kontakte.organisation_id` sind Migration 012 (Kern-Erweiterung).

## Verknüpfungsmodell (zentral)

Ein Deal = „**Einheit X** (wir, innen) verfolgt mit **Kontakt/Firma Y** (extern, außen) eine
Chance in **Pipeline/Phase Z**". Drei Bezüge, alle auf Bestehendes:

```
firmen (Mandant/Einheit, INNEN, Kern 0001) ──macht──> deals
kontakte (Person, AUSSEN, Kern 0001)       ──beteiligt──> deals
organisationen (externe Firma, Kern 0001)  ──beteiligt──> deals
                                                            │
                                          pipelines/stages (0003)
```

- **Mandant/Einheit (`firmen`, Kern):** INNENsicht — wer von uns macht das Geschäft.
  Pflichtbezug am Deal (`deals.firma_id`), steuert RLS und spätere Buchung. NICHT zu
  verwechseln mit externen Firmen.
- **Kontakt (`kontakte`, Kern):** Person als Ansprechpartner. Deal verweist, kein neuer
  Stamm.
- **Externe Firma (`organisationen`, Kern-Erweiterung, Variante B):** Geschäftspartner
  (Eigentümer-Firma, Makler, Bauträger, Lieferant). Mehrere Ansprechpartner je Firma. Deal
  kann an Organisation UND/ODER Kontakt hängen.

> **Kern-Erweiterung nötig (0001, separate Notiz):** relationale `organisationen` +
> `kontakte.organisation_id` (Person gehört zu externer Firma). Siehe `003_crm_000_konzept.md`
> Offene Punkte / Decision. Dieses Modul setzt das voraus, definiert es aber nicht.

## Pipelines & Stages

### pipelines
mandant_id FK, name, beschreibung, marke ENUM (hausverwaltung/alfa_apartments/alfa_campus/
alfa_development/uebergreifend), aktiv BOOL, sortierung INT, default_pipeline BOOL.

### pipeline_stages
pipeline_id FK, name, sortierung INT, wahrscheinlichkeit DECIMAL(5,2), ist_gewonnen BOOL,
ist_verloren BOOL, stalled_tage INT NULL, farbe VARCHAR(20).

## Deals

### deals
mandant_id FK, **firma_id FK (Pflicht — INNEN, welche Einheit/Mandant)**, pipeline_id FK,
stage_id FK, titel, kontakt_id FK NULL (AUSSEN-Person), organisation_id FK NULL
(AUSSEN-Firma), objekt_id FK NULL, einheit_immobilie_id FK NULL (Bezug zu Wohneinheit, nicht
Mandant!), wert DECIMAL(14,2), waehrung default EUR, erwartetes_abschluss_datum DATE,
status ENUM (offen/gewonnen/verloren), verloren_grund_id FK NULL, owner_akteur_id (bare UUID),
custom_values JSONB (Werte zu Custom-Field-Definitionen), in_stage_seit TIMESTAMPTZ,
abgeschlossen_am TIMESTAMPTZ NULL (gesetzt bei gewonnen/verloren),
**board_sort** INT NOT NULL DEFAULT 0 (manuelle Kanban-Reihenfolge je Stage, Mig. 020),
created_at, updated_at.

> Namensklärung (3 verschiedene Dinge, bewusst getrennt): `firma_id` = Mandant/Buchungskreis
> (innen); `organisation_id` = externe Geschäftsfirma (außen); `einheit_immobilie_id` =
> Wohn-/Gewerbeeinheit eines Objekts.

### deal_stage_historie
deal_id FK, von_stage_id FK NULL, nach_stage_id FK, akteur_id FK, am TIMESTAMPTZ,
verweildauer_tage INT. Für Tage-in-Stage, Durchlaufzeit, Audit-Timeline.

### deal_aktivitaeten
deal_id FK, typ ENUM (anruf/email/meeting/aufgabe/frist/notiz), titel, beschreibung TEXT,
faellig_am TIMESTAMPTZ, erledigt BOOL, erledigt_am TIMESTAMPTZ, akteur_id FK,
sip_referenz VARCHAR(100) NULL (sipgate-Hook), nachricht_id FK NULL (→ Kern Unified Inbox,
falls Aktivität aus eingehender Nachricht), erstellt_am.

> „Nächste Aktion" = nächste offene Aktivität nach faellig_am. E-Mail/Messaging am Deal
> werden über `nachricht_id` aus der Kern-Inbox referenziert, NICHT im CRM dupliziert.

### verloren_gruende
mandant_id FK, bezeichnung, sortierung INT, aktiv BOOL.

> Umsetzungshinweis (Migration 013): Alle `crm_`-Tabellen tragen `mandant_id` (RLS
> `mandant_isolation`) — auch `crm_pipeline_stages` und `crm_deal_stage_historie`, deren
> Feldlisten oben den Pipeline-/Deal-Bezug betonen.

## Custom Fields (UI-konfigurierbar, Vorbild Pipedrive Bild 8–10)

### custom_field_definitionen
mandant_id FK, entitaet ENUM (deal/lead), name, feldtyp ENUM (text/zahl/betrag/datum/
einzeloption/mehrfachoption/adresse/boolean), optionen JSONB (für Auswahltypen),
anzeige_hinzufuegen BOOL (in „Neu"-Formular), anzeige_detail BOOL (in Detailansicht),
pflicht BOOL (Qualitätsregel „Erforderlich"), wichtig BOOL (Qualitätsregel „Wichtig"),
pipeline_id FK NULL (feldweise je Pipeline oder global), sortierung INT, aktiv BOOL.

> Werte in `deals.custom_values` / `leads.custom_values` (JSONB, key=field-id).
> Pflicht/Wichtig wie Pipedrive. Pflege komplett über ERP-UI.

## Leads

### leads
mandant_id FK, firma_id FK NULL, quelle ENUM (manuell/web_formular/whatsapp/telefon/portal/
email/sonstige), kontakt_id FK NULL, organisation_id FK NULL, name, kontaktdaten,
anfrage_text TEXT, objekt_bezug_id FK NULL, status ENUM (neu/qualifiziert/konvertiert/
verworfen), verworfen_grund TEXT, labels TEXT[], custom_values JSONB,
zugeordnet_akteur_id FK, deal_id FK NULL, erstellt_am, geaendert_am.

## Bezug zur Stage-Automatik (Kern 0001, Channel-Routing 3.2)

Bestehende `pipeline_phase_aktionen` / `aktion_channels` referenzieren künftig
`pipeline_stages.id`. Kein Neubau — FK-Bezug + Mapping aus amoCRM-Phasen (OP-1).

## Datenintegrität (CRM-spezifisch)

> Basis: Kern, Abschnitt „Datenintegrität" in `001_erp_200_datenmodell.md`.

- **Warnung (UI-Vorabprüfung):** Lead/Deal zu existierendem Kontakt/Organisation
  (E-Mail/Telefon/Name-Fuzzy) → „verknüpfen?"; offener Deal selber Kontakt+Objekt+Pipeline →
  mögliche Dublette.
- **Block (DB-UNIQUE):** `pipeline_stages` (pipeline_id + sortierung); eine Default-Pipeline
  je Marke.
- **Status-/Beziehungs-Sperre:** abgeschlossener Deal (gewonnen/verloren) → Stage nicht per
  Drag änderbar (reaktivieren mit Audit). Konvertierter Lead → nicht erneut konvertierbar.
- **Feld-Edit-Stufen:** Stage/Owner/Wert/Abschlussdatum = `inline`; Pipeline/Mandant-Wechsel
  = `detail` (Konsequenz: Stage-Reset); konvertierter Lead = `gesperrt`.
- **Duplizieren (Deal):** neuer Entwurf; NICHT mitnehmen: Stage-Historie, Aktivitäten,
  Abschlussdaten.

## RLS / Mandantentrennung

`deals`, `leads`, `pipelines`, `pipeline_stages`, `deal_*` strikt nach `mandant_id` UND
`firma_id` (Einheit). Nutzer sieht nur Deals seiner berechtigten Einheiten. Mandanten-Filter
oben im Board (analog Pipedrive Pipeline-Umschalter) erlaubt einzelne Einheit oder
übergreifende Sicht.

## Migration amoCRM (OP-1)

amoCRM Kontakte (1929) + Unternehmen (149) + Deals/Leads + Custom-Fields exportieren →
bereinigen (viele Robot-/Booking-Auto-Kontakte) → mappen: Kontakte→`kontakte`,
Unternehmen→`organisationen`, Deals→`deals` (mit firma_id-Zuordnung!), Custom-Fields→
`custom_field_definitionen`. Stichtag + Mapping festzulegen.
