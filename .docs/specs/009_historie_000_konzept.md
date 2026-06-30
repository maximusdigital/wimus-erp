---
id: 0009
titel: ERP-weite Historie + Audit-Log
status: in_arbeit            # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.2.0            # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: historie
erstellt: 2026-06-28
geaendert: 2026-06-28
abhaengt_von: [0001, 0007]
---

# 0009 — ERP-weite Historie + Audit-Log

## Worum geht's

Eine **querschnittliche Historie-Schicht** als Klammer über alle Module — wie Suche (0006),
Kommunikation (0007), Felder (0008): eine Schicht, an die alle Module andocken. **Zwei bewusst
getrennte Ebenen** in einem Modul:

1. **Audit-Log (Fundament, technisch, lückenlos):** „Wer hat wann was geändert?" — jede relevante
   DB-Änderung (alt→neu, Akteur, Zeitpunkt), per **DB-Trigger** (nicht umgehbar), append-only.
   Für DSGVO-Auskunft, Nachvollziehbarkeit, Manipulationsschutz. Roh + vollständig.
2. **Aktivitäts-Historie (Sicht, fachlich, menschenlesbar):** kuratierter Zeitstrahl je Entität
   (Objekt/Einheit/Mieter/Vorgang/Kontakt): Vertrag angelegt, Zahlung eingegangen, Mahnung raus,
   Nachricht geschrieben, Schaden gemeldet, Schloss-Code vergeben … Nicht jedes technische Detail,
   sondern die fachlich bedeutsamen Ereignisse. Als **grafischer Zeitstrahl (Pipedrive-Stil)**,
   zentral UND dezentral.

## Einordnung im Log-Universum (ex-Backlog #10 — fünf Log-Arten, geklärt)

> Vorklärung #10 ist hiermit erledigt; die Abgrenzung ist Leitplanke dieses Moduls:

| Log-Art | Wo | Verhältnis zu 0009 |
|---------|-----|--------------------|
| **Audit-Log** (wer änderte was, technisch) | **0009 Fundament** | Kern dieses Moduls |
| **Aktivitäts-Historie** (fachlicher Zeitstrahl) | **0009 Sicht** | Kern dieses Moduls |
| Automation-Runs (Engine-Ausführungen) | Modul 0005 (`automation_runs`) | Lieferant: Run erzeugt Aktivität |
| Kommunikations-Verlauf (Nachrichten) | Modul 0007 (`kom_nachrichten`) | Lieferant: Nachricht erzeugt Aktivität |
| System-/Error-Log (App-/Job-/Webhook-Fehler) | Infra (Coolify/Container) | NICHT fachlich, NICHT in 0009 |

**Regel:** Module liefern fachliche Ereignisse über EINE API (`protokolliere(aktivität)`) an die
Aktivitäts-Historie — keine n Eigenbau-Historien. Technische Fehler bleiben im Infra-Log, nie hier.

## Leitprinzipien

- **Zwei Ebenen, klar getrennt:** Audit = technisch/lückenlos/roh (DB-Trigger). Historie =
  fachlich/kuratiert/menschenlesbar (App-Events). Die Historie KANN auf Audit-Einträge verweisen,
  ist aber nicht dasselbe.
- **Zentral UND dezentral, eine Wahrheit** (007-Muster): dieselben Aktivitäten zentral (globaler
  Feed) und dezentral (Reiter „Historie" je Detailseite), über `aktivitaet_bezug` (n:m) gefiltert.
  Bezug primär an der Entität, über Hierarchie (Mieter→Einheit→Objekt) abgeleitet. Ebenen-
  Umschalter „nur diese Ebene / inkl. untergeordnete".
- **Audit nicht umgehbar:** DB-Trigger auf der Whitelist kritischer Tabellen — auch direkte
  DB-Änderungen (außerhalb der App) werden erfasst. App-seitiges Logging wäre umgehbar → Trigger.
- **Eine protokolliere-API** für die fachliche Historie; Module rufen sie, statt eigene Logs.
- **RLS + Datenschutz** durchgängig (Verwalter- vs. Mietersicht, analog 007).
- **Fertige Bausteine vor Eigenbau** bei der Timeline-UI (Feed-Komponente), kein Pipedrive-Klon.

## Akteur-Erfassung (REALITÄT — Befund aus dem Bau)

> Die ursprüngliche Annahme „App setzt `SET LOCAL wimus.akteur_id` pro Request" ist REAL NICHT
> umsetzbar: supabase-js/PostgREST läuft über HTTP ohne App-seitige Transaktion/Session.
> **Gebaute Lösung:** Der Trigger liest in Reihenfolge `wimus.akteur_id` →
> `request.jwt.claims->>'sub'` → NULL(=direkt). PostgREST setzt `request.jwt.claims` je
> authentifiziertem Request automatisch → Audit kennt den auth-User OHNE App-Code. Service-Role
> hat leere Claim → `direkt`. `akteur_id uuid` OHNE harte FK (es ist die auth-User-UUID aus
> `auth.users`, nicht zwingend eine `wimus.akteure`-Zeile — FK würde auth-IDs ablehnen).
> Mapping auth-User→akteur ist Folge-Punkt.

## Audit-Log — Designentscheidungen (getroffen)

- **Erfassung: DB-Trigger** (lückenlos, nicht umgehbar). Ein generischer Trigger-Funktion
  (`audit_trigger()`), die `INSERT/UPDATE/DELETE` als alt/neu-JSONB + Akteur + Zeit schreibt.
- **Tiefe: Whitelist — 10 reale Tabellen (verifiziert):** `mietvertraege, kontakte,
  organisationen, forderungen, mahnungen, buchungen, belege, bank_umsaetze, belegung_sperren,
  fibu_buchungen` (alle mit id+mandant_id). Zugang/Schloss-Tabellen WEGGELASSEN (TTLock extern,
  real noch nicht da — Phase 3); `fibu_buchungen` ergänzt. Schlank → weniger Schreiblast.
- **Append-only:** Audit-Tabelle wird nur geschrieben, nie geändert/gelöscht (außer Retention).
- **Akteur:** aus dem App-Kontext (gesetzte Session-Variable je Request) — bei direkten DB-Changes
  „system/unbekannt".

## Aktivitäts-Historie — Designentscheidungen

- **App-seitig** über `protokolliere()` — die Module entscheiden, was fachlich bedeutsam ist
  (nicht jede DB-Zeile). Bewusst kuratiert.
- **Lieferanten:** Kommunikation (0007), Automation (0005), FiBu (Zahlung/Mahnung), Belegung,
  Verträge, Zugang … rufen `protokolliere()` mit Typ + Bezug.
- **Audit ≠ Historie:** Ein Audit-Eintrag („Spalte X von a auf b") ist nicht automatisch eine
  Aktivität. Manche Aktivitäten entstehen aus Audit-Ereignissen (optional verknüpfbar), aber die
  fachliche Kuratierung passiert in der App.

## UI: Pipedrive-Stil Zeitstrahl

- Vertikaler Timeline-Feed, neueste oben, verbindende Linie; je Ereignis Karte mit Typ-Icon +
  Farbe (Finanzen/Zahlung grün, Schaden/Mahnung gelb-rot, Kommunikation blau, Vertrag/Dokument
  neutral, Zugang/Schloss grau).
- Zeit-Gruppierung (Heute/Gestern/Letzte Woche/Datum), expandierbare Karten, Filter nach Typ/Modul.
- **EINE Timeline-Komponente** zentral (globaler Feed) UND dezentral (Reiter je Entität),
  Ebenen-Umschalter. Audit-Log hat eine eigene, nüchterne Tabellen-Ansicht (kein Timeline-Schmuck,
  rein technisch — für Compliance/Forensik).

## Abgrenzung

- **Nicht** die Automation-Runs (0005), nicht der Kommunikations-Verlauf (0007), nicht das
  System-/Error-Log (Infra) — die liefern höchstens Aktivitäten, sind aber eigene Dinge.
- **Nicht** die modul-internen Spec-Änderungshistorien / `_HISTORY.md` (das ist Projekt-/Doku-
  Ebene, nicht ERP-Laufzeit).
- **Vorhandene Einzel-Historien** (z.B. Mahnstatus-Verlauf) → prüfen, ob sie in die Aktivitäts-
  Historie einfließen statt danebenzustehen (real verifizieren, nicht doppeln).

## Steht (gebaut & läuft)

- **Modul 009 GEBAUT + EINGESPIELT (Migration 028 via /pg/query verifiziert, 382 Tests grün):**
  `audit_trigger()` (SECURITY DEFINER, EXCEPTION-gekapselt) + `changed_keys()` + `audit_log`
  (append-only via Grant nur-SELECT) + Audit-Trigger auf **10 realen Whitelist-Tabellen**
  (mietvertraege, kontakte, organisationen, forderungen, mahnungen, buchungen, belege,
  bank_umsaetze, belegung_sperren, fibu_buchungen). `aktivitaeten` + `aktivitaet_bezug` (n:m).
  Service `lib/historie/` (protokolliere/feed/audit/akteur/bezug/stil). `protokolliere()` um
  optionales `hierarchie` erweitert (Aufrufer kann bekannte Einheit/Objekt mitgeben → erscheint
  auch in Einheit-/Objekt-Historie). UI: EINE Timeline
  (zentral /historie + dezentral <HistorieTab> + Audit-Tabelle /einstellungen/audit). Lieferant
  `vertrag_angelegt` verdrahtet.
- **Stufe 2 / geparkt:** weitere Lieferanten (FiBu/Kommunikation/Belegung), HistorieTab in
  Detailseiten einhängen, Rollen-Restriktion Audit (nur Verwalter/Admin), audit_log_id-Kopplung.

## In Arbeit

- Folge-Verdrahtung (Stufe 2, s.o.) — Service steht, nur Aufrufe/Einbindung fehlen.

## Roadmap (bewusst später)

- Audit-Diff-Viewer (alt/neu visuell) in der Compliance-Ansicht.
- Aktivitäts-Historie als durchsuchbare Entität in 0006.
- Retention-Automatik: **Default audit_log 10 Jahre** (analog GoBD/§257 HGB/§147 AO — Whitelist
  ist v.a. Finanzen/Verträge); aktivitaeten unbegrenzt (kuratiert/klein). DSGVO-Lösch-Ersuchen →
  gezielte Anonymisierung der personenbez. Felder im alt/neu-JSONB (nicht hart löschen,
  Audit-Integrität). Retention-JOB = eigener Schritt, vor Scharfschalten mit StB gegenchecken.

## Offene Punkte → Claude Code verifiziert gegen reales Schema

1. **Whitelist-Tabellen** real verifizieren (welche existieren, exakte Namen — Verträge/Finanzen/
   Zugang/Kontakte).
2. **Akteur-Quelle:** wie ist der aktuelle Nutzer/Akteur im Request real verfügbar (Session-Var
   für Trigger setzbar?).
3. **Vorhandene Einzel-Historien** (Mahnstatus etc.) — einbinden oder belassen?
4. **Retention/DSGVO** (Löschpflicht vs. Audit-Pflicht) — Default-Aufbewahrung festlegen.

## Decision-Log

- 2026-06-28: **Akteur über `request.jwt.claims->>'sub'`** (Fallback-Kette), NICHT SET LOCAL
  (real nicht setzbar über PostgREST). akteur_id uuid OHNE FK (auth-User-UUID).
- 2026-06-28: **Whitelist final 10 reale Tabellen** (Zugang weg → Phase 3; fibu_buchungen dazu).
- 2026-06-28: **append-only via Grant (nur SELECT)** statt Trigger-Verbot.
- 2026-06-28: **Retention audit_log 10 Jahre** (GoBD/HGB/AO), aktivitaeten unbegrenzt; DSGVO-
  Löschung via Anonymisierung. Retention-Job eigener Schritt.

- 2026-06-28: **Eigenes Modul `009_historie`** (querschnittlich), zwei Ebenen (Audit + Historie).
- 2026-06-28: **#10 Log-Konzept geklärt** — fünf Log-Arten zugeordnet (s. Tabelle); System-/Error-
  Log bleibt Infra, Automation/Kommunikation sind Lieferanten.
- 2026-06-28: **Audit per DB-Trigger** (lückenlos, nicht umgehbar), nicht app-seitig.
- 2026-06-28: **Audit-Tiefe = Whitelist** kritischer Tabellen (Verträge/Finanzen/Zugang/Kontakte),
  nicht alle.
- 2026-06-28: **Beide Ebenen + Timeline in einem Aufbau** (nicht gestaffelt).
- 2026-06-28: **Zentral/dezentral über `aktivitaet_bezug`** (007-Muster wiederverwendet).

## Meilensteine

| Version | Datum | Status | Beschreibung |
|---------|-------|--------|--------------|
| 0.2.0 | 2026-06-28 | in_arbeit | GEBAUT (Migration 028 via /pg/query, 382 Tests grün): Audit (Trigger 10 Whitelist-Tabellen, Akteur via request.jwt.claims, akteur_id ohne FK, Grant-append-only) + aktivitaeten/aktivitaet_bezug + Timeline-UI (zentral/dezentral/Audit). Lieferant vertrag_angelegt. Retention 10 J. dokumentiert. Stufe 2 geparkt. |
| 0.1.0 | 2026-06-28 | entwurf | Vorab-Spec: Modul 009_historie — Audit-Log (DB-Trigger, Whitelist) + Aktivitäts-Historie (protokolliere-API) + Pipedrive-Timeline (zentral/dezentral via aktivitaet_bezug). #10 Log-Konzept geklärt. Bau folgt. |

## Änderungshistorie

| Datum/Zeit (MESZ) | Vorgang | Dateien |
|-------------------|---------|---------|
| 2026-06-28 20:30 | v0.2.0: GEBAUT nachgezogen (Migration 028, Akteur via request.jwt.claims statt SET LOCAL, 10 Whitelist-Tabellen, akteur_id ohne FK, Retention 10 J.) | 000,200,300 |
| 2026-06-28 17:30 | v0.1.0: Modul 009_historie als Vorab-Spec angelegt; #10 Log-Konzept integriert/geklärt | 000,200,300 |
