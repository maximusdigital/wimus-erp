---
id: 0004
titel: Betrieb (Vorgangs-Engine — Schaden/Reparatur/Reinigung/Übergabe/Wartung)
status: in_arbeit
version: 0.4.1
modul: ops
erstellt: 2026-06-26
geaendert: 2026-06-28
abhaengt_von: [0001]
---

# 0004 — Betrieb (Vorgangs-Engine)

## Worum geht's

Der operative Alltag der Immobilienverwaltung — alles, was im laufenden Verhältnis an
Aufgaben, Schäden, Reinigung, Übergaben, Wartung und Koordination mit Dritten anfällt — läuft
über **eine generische Vorgangs-Engine**. Ein Vorgang ist die zentrale Einheit; die fachlichen
Ausprägungen (Reinigung, Übergabe, Wartung, Reparatur, Schaden) sind **dünne Typ-Erweiterungen**,
die den vollen Engine-Funktionsumfang erben — kein Parallelsystem je Bereich.

Migriert aus den Bestands-Konzepten (Übergabe v5 §4.6/§4.8/§4.9/§5.5; P14 Vorgang, P15
Einsatzplanung, P24 Dienstleister, P31 Wartung, P34 Notfall, P59 Checklisten, P61 Qualität).

## Architektur-Leitsatz: EINE Engine, Typen als Erweiterung

```
VORGANG (Engine — voller Funktionsumfang, gilt für JEDEN Typ)
  ├─ Typ reinigung  → vorgang_reinigung   (Turnaround, Inventarcheck, KZV-Buchungsbezug)
  ├─ Typ uebergabe  → vorgang_uebergabe   (Zähler, Schlüssel, Signatur, Einzug↔Auszug-Abgleich)
  ├─ Typ wartung    → vorgang_wartung     (Intervall/Frist-Bezug, Prüfprotokoll)
  ├─ Typ reparatur  → vorgang_reparatur   (massnahme_typ, Angebot/Preisspiegel, Gewährleistung)
  └─ Typ schaden    → vorgang_schaden     (Kategorie/Schwere, gestaffelte Abwicklung, Versicherung)
```

**Engine-Funktionsumfang (gilt immer):** Auto-Aktenzeichen · Status-Flow · interne (Akteur) +
externe (Organisation/Dienstleister) Zuweisung mit Auftrag-Versand · Eskalation · Verlauf/
Audit-Timeline · Foto Vorher/Nachher (+ Pflichtfotos) · Checklisten/Pflichtfelder je Typ ·
Benachrichtigung bei Statuswechsel · Kostenträger + Forderungs-/Beleg-Verknüpfung.

Typen sind **1:1-Zusatztabellen + eigene UI-Sicht**, keine Logik, die die Engine umgeht.
„Reinigung heute" / „meine Aufträge" = **Sicht/Filter** auf die Engine, kein eigenes Modell.

## Träger: Akteure (Mensch + KI)

Vorgänge werden von **Akteuren** getragen (Entscheidung 2026-06-27): eine Tabelle für Mensch
UND KI-Agent, mit Verfügbarkeit/Fähigkeiten. Ersetzt das alte `ma_profile` (Ü5). Intern =
Akteur, extern = Organisation/Dienstleister (Kern `organisationen`) bzw. `kontakte` (Handwerker).

## Steht (gebaut & läuft — Stand 2026-06-27)

- **Vorgänge-CRUD** (`/vorgaenge`, API, `wimus.vorgaenge`) + Plantafel (Kanban nach Status,
  bislang read-only). Felder: typ, massnahme_typ, prioritaet (notfall/hoch/normal/niedrig),
  status, kostentraeger, kosten_geschaetzt/_ist, leistungsdatum, Auto-Aktenzeichen, paperless_id.
- **Inventar/Asset-Register** (`/inventar`, `public.asset_register`) — Cutover→wimus offen.
- **Kern-Anbindung vorhanden:** `forderungen.vorgang_id` (Schaden→Forderung), `fristen.frist_typ`
  Wartungstypen, OCR-Routing → vorgaenge, Channel-/Akteur-Bezug konzeptionell.

## Steht zusätzlich (implementiert 2026-06-27, Migrationen 017/018)

- **Datenmodell**: `akteure` (Mensch+KI) + Verfügbarkeit/Fähigkeiten (017); `vorgaenge`
  geschärft (Status-/Typ-CHECK, owner_akteur_id, eskaliert, benachrichtigung_kanal),
  `vorgang_verlauf`/`_zuweisung`/`_foto` + 5 Typ-Tabellen (018).
- **Engine-Logik** `lib/ops/` (`statusUebergang`/`uebergangErlaubt`/`istAbgeschlossen`,
  Schadens-Staffel `schadenEinstufung`) + 9 Unit-Tests.
- **Status-Flow**: `/api/vorgaenge/[id]/status` (validierter Übergang + Verlauf-Eintrag);
  **Plantafel** mit native Drag&Drop (Spalte ziehen = Statuswechsel).
- **Akteure-CRUD** `/akteure` (+ API). **Vorgang-Detail**: Zuweisungen (intern Akteur /
  extern Organisation, Status-Kette), **Verlauf-Timeline**, **Typ-Panel** je Erweiterungstyp
  (Schaden mit Auto-Staffel Schwere/Abwicklungsstufe).

## In Arbeit (dieser Cycle)

- ~~Foto Vorher/Nachher-UI~~ → **erledigt 2026-06-28**: mobile Capture (Handy-Kamera) +
  Supabase Storage + Galerie je Phase (`components/vorgaenge/vorgang-fotos.tsx`).
- ~~Bild-Abgleich Einzug↔Auszug~~ → **erledigt 2026-06-28** (Claude Vision, NICHT Mistral):
  Zählerstand-Foto + Vorher/Nachher-Abgleich → JSON-Schema-Output + Confidence-Routing,
  Ergebnis an `vorgang_foto.ki_*` (`lib/integrations/claude.ts`, `/foto-analyse`, Mig. 019).
- ~~Schaden-Übernahme aus Abgleich~~ → **erledigt 2026-06-28**: „Als Schaden anlegen" je
  Vorschlag erzeugt einen Folge-Vorgang `typ=schaden` (+ `vorgang_schaden`, Beschreibung im
  Verlauf, Kostenträger Mieter→Kaution) via `/api/vorgaenge/[id]/schaden-uebernehmen`.
- Typ-Sichten/Filter („Reinigung heute", „meine Aufträge"), Checklisten-Ausführung-UI.
- ~~Eskalations-UI~~ → **erledigt 2026-06-27** (`lib/ops/eskalation.ts` + Anzeige Detail/Plantafel,
  manuell + rechnerisch).
- Externe Fähigkeiten (Benachrichtigung, Auftrag-Versand, KI-Prüfung) bleiben **Hook/Stub** —
  echte Lieferung via n8n/Channel/Storage/Claude-Vision später.

## Ideen / als Nächstes

- Mobile-PWA (Reinigung/Hausmeister, offline, Kamera, Tagesplan).
- KI-Schadenskategorisierung + Kostenschätzung aus Foto (Claude Vision); rekursiver
  Checklisten-Prüf-Loop (ki_schwellenwert 0.75, max_versuche 3).
- Einzug↔Auszug-Foto-Abgleich automatisiert → Kautionsabrechnung.
- Dienstleister-Preisspiegel/Bewertungen (P24), Einsatz-Score/Auto-Zuweisung (P15).
- Müllabfuhr-Kalenderimport je Standort; Winterdienst-Nachweispflicht.

## Entscheidungen (warum es so ist)

- 2026-06-27: **EINE Vorgangs-Engine, Typen als dünne Erweiterung** (statt
  gleichrangiger Parallelbereiche Reinigung/Übergabe/Wartung). Grund: voller Funktionsumfang
  (Foto/Benachrichtigung/Zuweisung/Eskalation/Verlauf/Kostenträger) wird genau einmal gebaut
  und von allen Typen geerbt; Typ = 1:1-Zusatztabelle + Sicht. Der frühere Parallel-Entwurf
  (`reinigungsauftraege`/`uebergabeprotokolle`/`wartungsobjekte` als eigene Bereiche) ist verworfen.
- 2026-06-27: **Vorgänge ziehen aus Kern 0001 in Modul 004.** Vom Umfang her eigenes Modul
  (wie FiBu/CRM). Im Kern bleibt nur der Verweis „Vorgänge → 004" + die Verknüpfungspunkte
  (`forderungen.vorgang_id`, `fristen`→Vorgang, Akteure als Träger). Nichts doppelt.
- 2026-06-27: **Träger = `akteure` (Mensch + KI), neu gebaut** (Kern-Erweiterung 0001),
  ersetzt `ma_profile`. Grund: vereinheitlicht menschliche und KI-Bearbeiter, trägt
  Verfügbarkeit/Fähigkeiten für Zuweisung/Eskalation.
- 2026-06-27: **Externe Fähigkeiten als Hook/Stub.** Benachrichtigung bei Statuswechsel,
  externer Auftrag-Versand, Foto-Capture/Storage und KI-Prüfung werden mit Feldern + Status +
  Webhook/Log angelegt; echte Anbindung (n8n/Channel/Paperless/Claude Vision) folgt separat.
- 2026-06-27: **Zielschema `wimus`** für alle 004-Tabellen (App-Default). Asset-Register-Cutover
  public→wimus ist separates Thema.
- 2026-06-27: **Gestaffelte KZV-Schadensabwicklung** (aus Praxis, Spec502 §3.1): <50€ aus
  Kaution/Pauschale · 50–500 · 500–5.000 (Kaution+Versicherung) · 5.000–10.000 (Mahnbescheid/AG)
  · >10.000 (Anwalt). Steuert `vorgang_schaden` + Forderungs-/Versicherungsbezug.
- 2026-06-27: **Wartung über Kern-Fristen** (nicht eigene Mechanik): Fristen (`frist_typ
  wartung_*`) erzeugen Wartungs-Vorgänge; `vorgang_wartung` trägt nur Intervall-/Protokoll-Bezug.
- 2026-06-28: **KI-Bildverarbeitung — Modelltrennung Mistral≠Claude.** Mistral OCR bleibt
  FiBu/Belege-only; **Claude Vision** (`claude-opus-4-8`) macht die zwei Übergabe-Bildaufgaben
  (Zählerstand-Foto, Vorher/Nachher-Abgleich). Korrigiert die frühere Idee „Mistral Pixtral fürs
  Bild". Grund: ein Belegmodell ≠ ein Foto-/Vergleichsmodell; Trennung hält die Pipelines sauber.
- 2026-06-28: **Strukturierter Output + Confidence-Routing** statt Fließtext. Schema im Prompt,
  nur JSON, serverseitig (zod) validiert → DB-Felder. Routing ≥0.90 auto · 0.75–0.89 pruefen ·
  <0.75 manuell; kritische Felder (Zähler→Abrechnung, Schaden→Kaution) **nie auto**.
- 2026-06-28: **Kein zusätzliches Vision-Modell.** Volumen ~500 Bilder/Monat (<1 €) → keine
  Volumen-Optimierung/Fallback, Qualität vor Sparen. **Vorbehalt:** Modellgüte an 20–30 echten
  Vorher/Nachher-Paaren verifizieren, BEVOR Auto-Confidence-Schwellen scharf gestellt werden.
- 2026-06-28: **Schaden-Kostenträger aus Übergabe-Richtung** (nicht hart `mieter`): Auszug→`mieter`
  (Verschulden→Kaution), Einzug→`vermieter` (Bestandsschaden); Override via `kostentraeger`. ENUM
  `(vermieter/mieter/versicherung/weg)` bleibt — `vermieter` ist das richtige Wort.
- 2026-06-28: **Schaden-Übernahme idempotent** (Dubletten-Block wie Kern): Vorschlag in
  `vorgang_foto.ki_analyse.schaeden[index]` mit `uebernommen:true` + `folge_vorgang_id` markiert;
  Übernahme referenziert `{fotoId,index}` (Vorschlag serverseitig aus Analyse, nicht Client),
  erneute Übernahme → 409. Grund: Reload/Doppelklick darf keinen zweiten Schaden anlegen.

## Offene Punkte

- OP-1: Checklisten-Tabellen aus Migration 002 (`checklisten_*`) wiederverwenden vs. neu —
  Tendenz wiederverwenden (Definition `vorlagen`/`positionen`), Ausführung an `vorgaenge` + Akteur.
- OP-2: Dienstleister-Bewertungen/Preislisten — an `organisationen` (Kern) oder in 004? (Tendenz 004.)
- OP-3: Foto-Ablage — Paperless (Bild/PDF) vs. Nextcloud (Video); Übergabefotos wohin.
- OP-4: Mobile-PWA-Tech (offline) — eigener Stack vs. responsive Web.
- OP-5: Müllabfuhr-Quelle (Gemeinde-Kalender) je Standort.
- OP-6: Alte schema-only-Tabellen (`ma_profile`/`einsaetze`/`auftrag_zuweisungen`/`geraete`/
  `wartungsintervalle`/`prozess_*`) aus 002 — die durch das neue Modell ersetzten als
  „abgelöst" markieren bzw. droppen, sobald 004 steht.

## Meilensteine & Versionen

| Version | Datum | Status | Inhalt / zugehöriger Stand |
|---------|-------|--------|----------------------------|
| 0.4.1 | 2026-06-28 | in_arbeit | Schaden-Übernahme aus KI-Abgleich: „Als Schaden anlegen" je Vorschlag → Folge-Vorgang `typ=schaden` + `vorgang_schaden` + Verlauf (`/api/vorgaenge/[id]/schaden-uebernehmen`). |
| 0.4.0 | 2026-06-28 | in_arbeit | KI-Bildverarbeitung Übergabe (Claude Vision): Zählerstand + Vorher/Nachher-Abgleich, JSON-Schema-Output + Confidence-Routing, `vorgang_foto.ki_*` (Mig. 019), `lib/integrations/claude.ts` + `lib/ops/confidence.ts` (+Tests) + `/foto-analyse` + Foto-UI-Erweiterung. Mistral bleibt FiBu-only. |
| 0.3.0 | 2026-06-27 | in_arbeit | Engine implementiert: Migrationen 017 (akteure) + 018 (vorgaenge geschärft + verlauf/zuweisung/foto + 5 Typ-Tabellen); lib/ops + Tests; Status-Flow-API + Plantafel-DnD; Akteure-CRUD; Vorgang-Detail mit Zuweisungen/Verlauf/Typ-Panels. |
| 0.2.0 | 2026-06-27 | in_arbeit | Feinspec aus echten Quellen: Engine-Architektur (eine Engine + 5 Typ-Erweiterungen), Träger `akteure`, externe Hooks, Umzug Vorgänge 0001→004. Ersetzt den aus dem Chat rekonstruierten Grobentwurf. |
| 0.1.0 | 2026-06-26 | abgelöst | Grobentwurf (chat-rekonstruiert, unzuverlässig) — durch 0.2.0 ersetzt. |

## Änderungshistorie

> Laufendes Protokoll aller Änderungen am Modul (neueste oben). Vorgang ≤ 100 Zeichen.

> Bau-Chronik aus der echten Git-Historie nachgetragen (Committer-Zeit, `git log`),
> Commit-Kürzel in Klammern. Doku-Commits kursiv kenntlich.

| Datum/Zeit | Vorgang | Betroffen |
|------------|---------|-----------|
| 2026-06-28 02:25 | Schaden-Übernahme: Kostenträger aus Richtung (Auszug→mieter/Einzug→vermieter) + idempotent (ki_analyse-Markierung); Typ-Icons → Lucide | 000/200/300/400, schaden-uebernehmen, foto-analyse, vorgang-fotos |
| 2026-06-28 01:35 | Spec festgeschrieben auf realen Stand (400/500/600 + README-Index) + Bau-Chronik aus git | alle 004 + README |
| 2026-06-28 01:25 | Schaden-Übernahme aus KI-Abgleich → Folge-Vorgang typ=schaden + vorgang_schaden + Verlauf (e0df43b) | schaden-uebernehmen, vorgang-fotos |
| 2026-06-28 01:08 | KI-Bildverarbeitung Übergabe (Claude Vision: Zähler + Vorher/Nachher-Abgleich, JSON+Confidence) (13bdf66) | Mig.019, lib/claude, lib/ops/confidence, foto-analyse |
| 2026-06-28 00:42 | *Doku: Foto-UI erledigt, Bild-Abgleich als nächster Schritt (83d887d)* | 000_konzept |
| 2026-06-28 00:41 | Foto-UI Vorher/Nachher mobile-first (Kamera + Supabase Storage + Galerie) (057be5f) | vorgang-fotos, foto-route |
| 2026-06-27 23:55 | *Doku: Eskalation erledigt, Bild-Abgleich-Hook präzisiert (ac2e03e)* | 000_konzept |
| 2026-06-27 23:54 | Eskalation: Auslösung (computed + manuell) + Anzeige Detail/Plantafel (e39acda) | lib/ops/eskalation, vorgang-eskalation |
| 2026-06-27 19:07 | *Doku: Konzept auf implementierten Stand v0.3.0 (d6be882)* | 000_konzept |
| 2026-06-27 19:06 | Typ-Panels: 5 Vorgangstyp-Erweiterungen am Detail (f3ea090) | vorgang-typ-panel, typ-route |
| 2026-06-27 18:38 | Akteure-CRUD + Vorgang-Detail (Zuweisungen + Verlauf-Timeline) (653e6ec) | akteure, vorgang_zuweisung, akteur-verwaltung |
| 2026-06-27 18:27 | Engine-Kern: Status-Flow, Schadens-Staffel, Plantafel-DnD + Migrationen 017/018 (e1bd926) | Mig.017/018, lib/ops, vorgaenge |
| 2026-06-27 14:50 | *Spec-Neuaufbau aus echten Quellen (Engine-Architektur) + Umzug Vorgänge aus Kern (82271a7)* | alle 004 |
| 2026-06-23 11:51 | Asset-Register / Inventar – CRUD (Phase 4) (8a5ca21) | asset_register, /inventar |
| 2026-06-23 11:41 | Vorgänge (P14) CRUD + Plantafel (P15, Kanban) (Phase 4) (e3e7b0c) | vorgaenge, /vorgaenge |
