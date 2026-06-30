---
id: 0007
titel: Kommunikations-Schicht (E-Mail + WhatsApp)
status: in_arbeit            # entwurf | in_arbeit | freigegeben | umgesetzt | abgelöst
version: 0.4.0            # springt nur am Meilenstein; lebt NUR in dieser Datei
modul: kommunikation
erstellt: 2026-06-28
geaendert: 2026-06-29
abhaengt_von: [0001]
---

# 0007 — Kommunikations-Schicht (E-Mail + WhatsApp)

## Worum geht's

Eine **kanalübergreifende, INTEGRIERTE Kommunikations-Schicht** im ERP. E-Mail und WhatsApp
laufen als gleichberechtigte **Kanal-Adapter** in EINE gemeinsame Nachrichten-Wahrheit. Ziel:
beide Kanäle flächendeckend als ERP-Kontaktkanal nutzen (nicht nur Support-Insel) — eingehend
+ ausgehend, mit Anhängen, Chatverläufen, Signaturen, Konfig-UI und einem ersten Autoreply.

**Kein danebenstehendes Fremdsystem.** Keine Omnichannel-Plattform (Chatwoot/Chaskiq/Tiledesk =
Zammad-Klasse) eingebettet. Stattdessen: ERP-eigene Schicht + fertige BAUSTEINE (E-Mail-Libs,
GreenAPI, React-Chat-UI-Kit). Orchestrierung/Datenhaltung bleibt im ERP. Konsistent mit dem
Schaltzentralen-Prinzip und der Zammad-raus-Entscheidung.

## Leitprinzipien

- **Eine Nachrichten-Wahrheit, viele Kanäle.** Alle Nachrichten (E-Mail, WhatsApp, später OTA)
  in einer gemeinsamen Tabelle `kom_nachrichten`, je Kanal ein Adapter. Channel-Adapter-Pattern.
- **Kontakt-zentriert, Immobilienbezug optional.** Jede Nachricht hängt primär an einem
  **Kontakt** (`kontakte`-Tabelle, generisch — NICHT nur Mieter). JEDER Kontakttyp hat einen
  Kommunikations-Thread: Mieter, Interessent, Bewerber, Makler, Handwerker, Lieferant,
  Eigentümer, Behörde … Der Kontakttyp/die Rolle kommt aus `kontakte` (Feld ‹kontakt_typ/rolle›
  — real verifizieren); ein Kontakt kann MEHRERE Rollen haben (z.B. Makler + Eigentümer →
  real prüfen ob Einzelfeld oder n:m-Rollen). Die Immobilien-Ableitung (Einheit/Objekt) ist
  OPTIONAL obendrauf — nur wenn der Kontakt einen solchen Bezug hat (Mieter→Einheit→Objekt).
  Ein Makler-Thread hat z.B. nur Kontakt-Bezug, kein Objekt darunter — das ist korrekt.
- **Zentral UND dezentral, eine Wahrheit.** Dieselben Nachrichten sind zentral (Unified Inbox)
  und dezentral (Reiter „Kommunikation" bei Kontakt/Objekt/Einheit/Mieter/Vorgang) sichtbar — nur
  anders gefiltert über `kom_nachricht_bezug`. Kein zweiter Datentopf. Bezug PRIMÄR über den
  Kontakt (jeder Kontakttyp), Einheit/Objekt werden — falls vorhanden — über die ERP-Hierarchie
  (Mieter→Einheit→Objekt) abgeleitet. Eine Nachricht kann mehreren Kontexten zugeordnet sein
  (n:m) — WG-Rundnachricht erscheint bei der WG/Einheit UND bei jedem einzelnen Mieter. Höhere
  Ebenen mit umschaltbarer Sicht („nur diese Ebene" / „inkl. untergeordnete"). Datenschutz:
  untergeordnete-Sicht ist Verwalter-Sicht, kein Mieter sieht die Privat-Kommunikation eines
  Mit-Mieters.
- **Fertige Bausteine vor Eigenbau** (Grundsatz): E-Mail über `ImapFlow` + `mailparser` +
  `Nodemailer` (gratis OSS); WhatsApp über GreenAPI; Chat-UI über fertiges React-Kit
  (chatscope/MinChat). Eigenbau nur für die ERP-Orchestrierung (Adapter, Zuordnung, Konfig).
- **Secrets sind heilig.** IMAP-Passwörter + GreenAPI-Tokens NUR serverseitig, verschlüsselt,
  in der UI write-only (setzen, nie anzeigen). Analog Service-Role-Key-Regel. Kein Klartext.
- **Adapter kapseln Protokoll.** Der Rest des ERP spricht nur die einheitliche
  Kommunikations-API (`sendeNachricht`, `empfangeNachricht`), nie direkt IMAP/GreenAPI.
- **RLS durchgängig.** Nachrichten sind mandanten-/markengebunden; ein Nutzer sieht nur seine.
- **Speicherung darf nie blockieren.** Kanal-Fehler (IMAP down, GreenAPI-Fehler) dürfen die
  ERP-Persistenz nicht verhindern — Ausgang über Retry-Queue (analog Beds24-Block-Muster).

## Bausteine (fertig, nicht nachbauen)

| Zweck | Baustein | Lizenz |
|-------|----------|--------|
| E-Mail empfangen (IMAP) | `ImapFlow` (IDLE/Echtzeit, OAuth2) | MIT |
| E-Mail parsen (inkl. Anhänge) | `mailparser` | MIT |
| E-Mail senden (SMTP) | `Nodemailer` | MIT |
| WhatsApp (senden/empfangen/Medien/Verlauf) | GreenAPI (REST + Webhooks) | Dienst |
| Chat-Oberfläche | `@chatscope/chat-ui-kit-react` ODER `@minchat/react-chat-ui` | MIT |

> Gateway-Dienste (EmailEngine/rustmailer) bewusst NICHT — kostenpflichtig, Abschalt-Risiko,
> bei ~8–12 Postfächern nicht nötig (s. _BACKLOG #2). Erst ab ~30 Postfächern erwägen.

## Funktionsumfang (Stufe 1)

1. **Kanal-Adapter E-Mail:** Multi-Postfach IMAP (eingehend, IDLE) + SMTP (ausgehend), je
   Postfach Zugangsdaten/Zweck/Marke, Anhänge.
2. **Kanal-Adapter WhatsApp (GreenAPI):** je Instanz/Marke, eingehende Webhooks, Senden
   (Text/Datei), Medien-Download, Chatverlauf-Import.
3. **Gemeinsame Nachrichten-Schicht:** `kom_nachrichten` + `kom_anhaenge` + Konversations-
   gruppierung (Thread/Chat), Zuordnung zu Kontakt/Vorgang.
4. **Bausteine (Templates, Signaturen, Telefon-Skripte, Schnipsel):** eine Vorlagen-Schicht —
   alle „Bausteine einer Nachricht" in EINER `kom_bausteine`-Tabelle (`baustein_typ`). Kanal-
   gebunden, mit Scope-Fallback (Akteur→Projekt→Firma→Marke→Default), je Scope ein Default +
   weitere zur Auswahl. Platzhalter aus festen Daten ({mieter}/{objekt}/{betrag}) + Custom Fields
   (008) + Signatur-Verweis. **Ersetzt die frühere separate `kom_signaturen`** (Signatur = ein
   baustein_typ). Auch in Automatiken (005) per ID nutzbar.
5. **Konfig-UI** (`/einstellungen/kommunikation` + `/einstellungen/bausteine`): Postfächer/
   Instanzen CRUD, Baustein-Verwaltung (Liste filterbar nach Typ/Kanal/Scope, Editor mit
   Platzhalter-Einfügung + Vorschau), Secrets write-only.
   Secrets write-only.
6. **Chat-/Inbox-UI:** fertiges React-Kit, kanalübergreifende Unified Inbox + Konversationsansicht.
7. **Autoreply (statisch, erster Automatik-Fall):** Regel je Postfach/Instanz → Bedingung
   (Geschäftszeiten/Stichwort) → fester Antworttext. Mit Upgrade-Pfad zu Modul 005_automation.

## Verhältnis zu anderen Modulen

- **0001 Kern:** Channel-Routing (Lock-Mechanik KI/Mensch), Akteure, OCR-Pipeline. Anhänge
  (Belegfotos) fließen in die FiBu-OCR (`verarbeiteBeleg`). Nachrichten hängen an Kontakten/
  Vorgängen des Kerns.
- **0002 FiBu:** WhatsApp-/Mail-Anhang Belegfoto → OCR → Beleg. Rechnungsversand (ZUGFeRD,
  _BACKLOG #4) nutzt später diese Schicht als Versandweg.
- **0005 Automation (geplant):** übernimmt später den Autoreply. Bis dahin lebt Autoreply
  eigenständig hier (s. „Autoreply" unten).
- **0006 Suche:** `kom_nachrichten` ist eine durchsuchbare Entität (Registry-Eintrag).

## Autoreply — Abhängigkeit zu 0005 sauber gelöst

Autoreply ist fachlich ein Automatik-Fall (Trigger→Bedingung→Aktion), aber Modul `005_automation`
existiert noch nicht. Lösung **ohne Blockade**:

- Stufe 1 (dieses Modul): Autoreply als **eigenständiger, einfacher Mechanismus** in der
  Kommunikations-Schicht — `kom_autoreply_regeln` (je Postfach/Instanz, Bedingung, fester Text),
  ausgelöst beim Nachrichteneingang. KEINE KI, rein deterministisch.
- Upgrade-Pfad (wenn 0005 da ist): Die Regel-Auswertung wandert in die Automatik-Engine; die
  Aktion „sende festen Text" wird zu „rufe Engine/Agent". Das Datenmodell ist so angelegt, dass
  die Engine die Regeln übernehmen kann (kein Wegwerf). Im Decision-Log dokumentiert.

## Steht (gebaut & läuft)

- Noch nichts — Modul neu (Entwurf).
- Vorhandenes, worauf aufgebaut wird: Kern-Channel-Routing (Lock-Mechanik KI/Mensch),
  OCR-Pipeline (`verarbeiteBeleg`), ggf. bestehende `nachrichten`/`portal_nachrichten` —
  Claude Code prüft, ob vorhanden → wiederverwenden statt doppeln (s. offene Punkte).

## In Arbeit

- **Kommunikations-Schicht (Vorab-Spec, Bau folgt):** s. `007_kommunikation_200_datenmodell.md`
  + `_300_prozesse.md`.

## Roadmap (bewusst später)

- OTA-Gastnachrichten (Beds24) als dritter Kanal-Adapter.
- ZUGFeRD-Rechnungsversand über diese Schicht (_BACKLOG #4).
- Autoreply → Automatik-Engine (0005) migrieren; dann KI-Antwort via Agenten-Modul.
- WhatsApp „GREEN-API: WABA" (offiziell) als Alternative bei Ban-Problemen.

## Historie-Andockung (009) — Stand

- **Eingehend bereits angedockt:** `persistiereEingehend` ruft `protokolliere(nachricht_empfangen)`
  (Modul 009, beide Kanäle) — DORMANT, feuert automatisch sobald die Ingestion-Webhook-Route die
  Nachrichten hereinreicht (= der eigentliche 007-Bau-Schritt).
- **Ausgehend offen:** `persistiereAusgehend` existiert noch nicht → beim Bau des Ausgangs-Pfads
  dort analog `protokolliere(nachricht_gesendet)` andocken (Folge-Punkt, gehört zum 007-Ingestion/
  Sende-Bau).

## GreenAPI-Instanz

- Eine reale WhatsApp-Instanz existiert. Verbindungsdaten + Token leben in `.env.local` /
  Konfig-UI (write-only, verschlüsselt) — NICHT in der Doku/Spec/Repo. Adapter liest sie aus der
  Umgebung (z.B. `process.env.GREENAPI_TOKEN`).
- ⚠ **Instanz aktuell ABGELAUFEN** (Stand zuletzt: bezahlter Zeitraum ausgelaufen) → Senden/
  Empfangen scheitert bis zur Verlängerung. Vorbedingung für den realen WhatsApp-Test: Instanz
  reaktivieren. Der E-Mail-Adapter ist davon unabhängig baubar/testbar.

## Offene Punkte → Claude Code verifiziert gegen reales Schema

> Spec ~99% entscheidungsfest. Folgendes gegen reales `wimus`-Schema verifizieren, nicht raten:
1. **kontakte-Struktur:** Wie heißt das Rollen-/Typ-Feld (`kontakt_typ`/`rolle`/`kategorie`)?
   Einzelfeld oder n:m-Rollen (Kontakt kann Makler UND Eigentümer sein)? Welche Typen existieren?
   → bestimmt die dezentralen Reiter + Filter.
2. **Bestehende Nachrichten-Tabellen:** Gibt es `nachrichten` / `portal_nachrichten` real? →
   wiederverwenden/erweitern statt `kom_nachrichten` neu, falls sinnvoll. Sonst neu anlegen.
2. **Kontakt-/Vorgang-Zuordnung:** Reale Tabellen für Kontakte/Vorgänge + Fremdschlüssel.
3. **Marken-/Mandanten-Spalte** je Tabelle (RLS).
4. **Medien-Ablage:** Wohin physische Anhänge (vorhandenes Storage? Nextcloud/Paperless/Supabase
   Storage?) — bestehende Lösung nutzen.
5. **GreenAPI-Instanz-Verwaltung:** ob TB04-Sende-Anbindung schon existiert → erweitern.

## Decision-Log

- 2026-06-28: **Baustein-System** (`kom_bausteine`): Templates/Signaturen/Telefon-Skripte/
  Schnipsel als EIN Vorlagen-Typ (`baustein_typ`), kanal-gebunden, Scope-Fallback
  (Akteur→Projekt→Firma→Marke→Default), je Scope ein Default. Ersetzt `kom_signaturen`. Platzhalter
  aus festen Daten + Custom Fields (008) + Signatur-Verweis. Auch in Automatiken (005) nutzbar.
- 2026-06-28: **Kontakt-zentriert statt mieter-zentriert.** Jeder Kontakttyp (Mieter/Interessent/
  Bewerber/Makler/Handwerker/Lieferant/Eigentümer/Behörde) hat einen Kommunikations-Thread;
  Immobilienbezug (Einheit/Objekt) optional. Kontakttyp/Rolle aus `kontakte` (real verifizieren),
  Mehrfach-Rollen möglich.
- 2026-06-28: **Zentral + dezentral, eine Wahrheit.** Nachrichten zusätzlich dezentral je
  Objekt/Einheit/Mieter/Vorgang sichtbar; Zuordnung primär über Kontakt + abgeleitet über
  Hierarchie; n:m-Bezug (`kom_nachricht_bezug`) für WG-/Sammel-Nachrichten; Ebenen-Umschalter;
  Datenschutz bei Vererbung (Verwalter- vs. Mietersicht).
- 2026-06-28: **Ein Modul `007_kommunikation`**, voller Umfang (E-Mail+WhatsApp+UI+Konfig+
  Signatur+Autoreply) statt Aufteilung.
- 2026-06-28: **Integriert, kein Fremdsystem** — keine Omnichannel-Plattform (Chatwoot &
  Co. = Zammad-Klasse); ERP-eigene Schicht + fertige Bausteine.
- 2026-06-28: **E-Mail Variante A** (ImapFlow+mailparser+Nodemailer, gratis OSS), NICHT
  EmailEngine/rustmailer (kostenpflichtig, Abschalt-Risiko, erst ab ~30 Postf.).
- 2026-06-28: **WhatsApp GreenAPI Standard** (kein 24h-Fenster; Ban-Risiko via Number-Warming/
  Rate-Limit mitigieren).
- 2026-06-28: **Chat-UI über fertiges React-Kit** (chatscope/MinChat), keine selbstgebauten
  Bubbles, keine Omnichannel-Plattform.
- 2026-06-28: **Secrets serverseitig/verschlüsselt/write-only** (analog Service-Role-Regel).
- 2026-06-28: **Autoreply eigenständig in 0007 (Stufe 1), Upgrade-Pfad zu 0005** — entkoppelt
  von der noch nicht existierenden Automatik-Engine, kein Wegwerf.

## Meilensteine

| Version | Datum | Status | Beschreibung |
|---------|-------|--------|--------------|
| 0.4.0 | 2026-06-28 | entwurf | + Baustein-System (kom_bausteine: Templates/Signaturen/Telefon-Skripte/Schnipsel, Scope-Fallback Akteur→Projekt→Firma→Marke→Default, je Scope Default; Platzhalter feste Daten + Custom Fields 008 + Signatur-Verweis; ersetzt kom_signaturen; in Automatiken nutzbar). |
| 0.3.0 | 2026-06-28 | entwurf | + Kontakt-zentriert: jeder Kontakttyp (Interessent/Bewerber/Makler/Handwerker/Lieferant/Eigentümer…) hat Thread; Immobilienbezug optional; Rolle aus kontakte (Mehrfach-Rollen). |
| 0.2.0 | 2026-06-28 | entwurf | + Zentral/dezentral: Nachrichten je Objekt/Einheit/Mieter/Vorgang sichtbar (kom_nachricht_bezug n:m, Ableitung über Hierarchie, Ebenen-Umschalter, Datenschutz bei Vererbung). |
| 0.1.0 | 2026-06-28 | entwurf | Vorab-Spec Kommunikations-Schicht: Modul 007, E-Mail (Variante A) + WhatsApp (GreenAPI) als Adapter, eine Nachrichten-Wahrheit, Signaturen, Konfig-UI (Secrets write-only), Chat-UI-Kit, Autoreply statisch m. Upgrade-Pfad. Bau folgt. |

## Änderungshistorie

| Datum/Zeit (MESZ) | Vorgang | Dateien |
|-------------------|---------|---------|
| 2026-06-29 10:40 | GEBAUT (Teil): WhatsApp-Empfang (kom_wa_instanzen live, Webhook ERP) + Sendeweg (sendeWhatsapp, Token verschlüsselt, Rate-Limit, persistiereAusgehend, nachricht_gesendet-Historie), 394 Tests. NICHT live (Consumer fehlt, Deploy unhealthy). Status entwurf→in_arbeit. Folge → Backlog #16/#17 | Reports 1020/1040 |
| 2026-06-29 09:30 | v0.4.0: Baustein-System ergänzt (kom_bausteine, Scope-Fallback, Custom-Field-Platzhalter, ersetzt kom_signaturen) | 000,200,300 |
| 2026-06-28 22:40 | v0.3.0: Kontakt-zentriert (alle Kontakttypen, Immobilienbezug optional, Rolle aus kontakte, Mehrfach-Rollen) | 000,200,300 |
| 2026-06-28 21:50 | v0.2.0: Zentral+dezentral ergänzt (kom_nachricht_bezug n:m, Hierarchie-Ableitung, Ebenen-Umschalter, Datenschutz Vererbung) | 000,200,300 |
| 2026-06-28 21:30 | v0.1.0: Modul 007_kommunikation als Vorab-Spec angelegt (Konzept/Datenmodell/Prozesse) | 000,200,300 |
