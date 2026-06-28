---
gehoert_zu: 0004
dokument: Datenmodell
geaendert: 2026-06-28
---

# 0004 — Datenmodell

> Version & Status stehen in `004_ops_000_konzept.md`. Schema `wimus`, PK UUID, FK.
> `created_at`/`updated_at` auf allen Tabellen (Touch-Trigger), `mandant_id` + RLS
> `mandant_isolation` (über `public.user_mandanten`) auf allen Tabellen.
> Verweist auf Kern (0001): `objekte`, `einheiten`, `kontakte`, `organisationen`, `fristen`,
> `forderungen`, `versicherungen`, `buchungen` (KZV), `mietvertraege`. Erfindet nichts neu.

## Träger: akteure (Kern-Erweiterung 0001, Migration 017)

> Gehört konzeptionell in den Kern (0001) — hier referenziert, da 004 der erste Nutzer ist.

### akteure
mandant_id FK, typ ENUM (mensch/ki/extern), name, kontakt_id FK NULL (→ kontakte, bei Mensch),
benutzer_id UUID NULL (Auth-User), organisation_id FK NULL (→ organisationen, bei extern),
ki_modell TEXT NULL, ki_konfidenz_schwelle NUMERIC(3,2) NULL, bereich TEXT[] (reinigung/
hausmeister/handwerk/verwaltung/…), aktiv BOOL, created_at, updated_at.

### akteur_verfuegbarkeit
akteur_id FK, wochentag INT (0–6), von_uhr TIME, bis_uhr TIME, max_stunden_woche INT.

### akteur_faehigkeiten
akteur_id FK, faehigkeit TEXT, level INT NULL. (Skills für Auto-Zuweisung; einfach gehalten.)

## Engine: vorgaenge (vorhanden, geschärft)

### vorgaenge
> Bestehende Tabelle (Migration 002, `wimus`). Migration 018 ergänzt CHECKs + Engine-Felder.

mandant_id FK, objekt_id FK NULL, einheit_id FK NULL, gemeldet_von FK NULL (→ kontakte),
**typ** ENUM (schaden/reparatur/reinigung/uebergabe/wartung/anfrage/kuendigung/sonstiges),
**massnahme_typ** ENUM NULL (instandhaltung/modernisierung/instandsetzung/reparatur/wartung),
**prioritaet** ENUM (notfall/hoch/normal/niedrig), **status** ENUM (offen/zugewiesen/in_arbeit/
wartet_extern/erledigt/abgenommen/abgebrochen), **kostentraeger** ENUM (vermieter/mieter/
versicherung/weg), kosten_geschaetzt/kosten_ist NUMERIC(12,2), leistungsdatum DATE,
faellig_am TIMESTAMPTZ NULL, **owner_akteur_id** UUID NULL (→ akteure), handwerker_id FK NULL
(→ kontakte, extern), aktenzeichen (Auto-Trigger), lfd_nr, paperless_id,
**eskaliert** BOOL DEFAULT false, **eskaliert_am** TIMESTAMPTZ NULL,
**benachrichtigung_kanal** TEXT NULL (Hook: email/whatsapp/telegram/zammad),
created_at, updated_at.

> Status-Flow (kanonisch): `offen → zugewiesen → in_arbeit → (wartet_extern) → erledigt →
> abgenommen`; `abgebrochen` aus jedem offenen Status. Abschluss = erledigt/abgenommen/abgebrochen.

## Engine-Begleittabellen (Migration 018)

### vorgang_verlauf  (Audit-Timeline, gilt für jeden Typ)
mandant_id FK, vorgang_id FK, akteur_id UUID NULL, art ENUM (status/zuweisung/feld/notiz/
eskalation/benachrichtigung), von_status TEXT NULL, nach_status TEXT NULL, feld TEXT NULL,
alt_wert TEXT NULL, neu_wert TEXT NULL, notiz TEXT NULL, am TIMESTAMPTZ DEFAULT now().

### vorgang_zuweisung  (intern + extern)
mandant_id FK, vorgang_id FK, akteur_id UUID NULL (intern → akteure), organisation_id FK NULL
(extern), kontakt_id FK NULL (Handwerker), rolle ENUM (verantwortlich/ausfuehrend/extern),
status ENUM (vorgeschlagen/beauftragt/angenommen/abgelehnt/erledigt), auftrag_versendet_am
TIMESTAMPTZ NULL, auftrag_kanal TEXT NULL (Hook), grund ENUM NULL (primaer/vertretung/
kapazitaet/manuell/ki), created_at, updated_at.

### vorgang_foto  (Vorher/Nachher + Pflichtfotos + KI-Analyse)
mandant_id FK, vorgang_id FK, phase ENUM (vorher/nachher/befund/sonstig), paperless_id TEXT NULL,
url TEXT NULL, beschreibung TEXT, akteur_id UUID NULL, aufgenommen_am TIMESTAMPTZ DEFAULT now(),
**ki_analyse** JSONB NULL (strukturiertes Claude-Vision-Ergebnis: `{zaehler:[…]}` bzw.
`{schaeden:[…]}`), **ki_confidence** NUMERIC(3,2) NULL (Modell-Sicherheit 0..1),
**ki_status** ENUM NULL (auto/pruefen/manuell – Confidence-Routing),
**ki_analysiert_am** TIMESTAMPTZ NULL. (Migration 019.)

> Capture/Upload via Supabase Storage (`vorgang-fotos`); Bytes per Public-URL. KI-Analyse via
> Claude Vision (Endpoint `/api/vorgaenge/[id]/foto-analyse`) – Routing ≥0.90 auto · 0.75–0.89
> pruefen · <0.75 manuell, kritische Felder (Zähler→Abrechnung, Schaden→Kaution) nie auto.
> Abgleich-Schäden in `ki_analyse.schaeden[]` tragen bei Übernahme `uebernommen:true` +
> `folge_vorgang_id` (Idempotenz-Markierung, verhindert Doppelanlegen).

## Typ-Erweiterungen (1:1 zu vorgaenge, Migration 018)

> Genau ein Zusatzdatensatz je Vorgang (`vorgang_id` PK/FK). Jede Tabelle trägt `mandant_id` (RLS).

### vorgang_reinigung
vorgang_id PK/FK, buchung_id FK NULL (→ buchungen KZV), turnaround BOOL DEFAULT false,
inventar_ok BOOL NULL, naechster_checkin TIMESTAMPTZ NULL, dauer_soll_min INT NULL.

### vorgang_uebergabe
vorgang_id PK/FK, richtung ENUM (einzug/auszug), mietvertrag_id FK NULL, zaehlerstaende JSONB,
schluessel JSONB, signatur_paperless_id TEXT NULL, abgleich_vorgang_id FK NULL
(Einzug↔Auszug-Verknüpfung), kaution_relevant BOOL DEFAULT false.

### vorgang_wartung
vorgang_id PK/FK, frist_id FK NULL (→ fristen), intervall_typ TEXT NULL (wartung_rauchmelder/
_aufzug/_gas/_legionellen/…), pruefprotokoll_paperless_id TEXT NULL, naechste_faelligkeit DATE NULL.

### vorgang_reparatur
vorgang_id PK/FK, angebot_betrag NUMERIC(12,2) NULL, angebot_paperless_id TEXT NULL,
abgenommen BOOL DEFAULT false, abgenommen_am TIMESTAMPTZ NULL, gewaehrleistung_bis DATE NULL.

### vorgang_schaden
vorgang_id PK/FK, schaden_typ ENUM (boden/wand/sanitaer/elektro/moebel/fenster/sonstiges),
schwere ENUM (bagatell/mittel/gross/grossschaden), schaden_betrag NUMERIC(12,2) NULL,
abwicklungsstufe ENUM (kaution/plattform/manuell/mahnbescheid/anwalt) NULL,
versicherungsfall BOOL DEFAULT false, versicherung_id FK NULL (→ versicherungen),
forderung_id FK NULL (→ forderungen), festgestellt_am DATE NULL.

## Checklisten (Wiederverwendung Kern 002 + Akteur)

`checklisten_vorlagen` (name, gilt_fuer_typ, sprache, aktiv) und `checklisten_positionen`
(typ foto_ki/foto/checkbox/text/zahl/sprache, haeufigkeit, ki_kriterien, ki_schwellenwert 0.75,
max_versuche 3) bleiben wie in Migration 002. **Ausführung** über `checklisten_ausfuehrungen`
(+ `akteur_id` ergänzt) und `checklisten_ergebnisse` (je Position). KI-Prüf-Loop ist Hook.

## RLS / Datenintegrität

- Alle 004-Tabellen: RLS `mandant_isolation` (mandant_id über `public.user_mandanten`);
  `vorgang_*`-Erweiterungen tragen `mandant_id` redundant (konsistent mit fibu/crm, einfache RLS).
- **Block (DB):** `vorgang_<typ>.vorgang_id` PK (genau ein Zusatz je Vorgang).
- **Status-Sperre:** abgeschlossener Vorgang (erledigt/abgenommen/abgebrochen) → kein Drag im
  Plantafel; Reaktivieren erzeugt Verlauf-Eintrag.
- **Abgelöst (OP-6):** alte 002-Tabellen `ma_profile`/`einsaetze`/`auftrag_zuweisungen`/
  `geraete`/`wartungsintervalle`/`prozess_*` werden vom neuen Modell ersetzt (Drop später).
