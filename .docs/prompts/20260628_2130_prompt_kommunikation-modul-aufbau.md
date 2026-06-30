# Bau-Auftrag: Modul 007 (kommunikation) — E-Mail + WhatsApp integriert (2026-06-28 21:30 MESZ)

Voller Arbeitszyklus (CLAUDE.md, „check"). Vorab-Spec vollständig: `007_kommunikation_000_konzept.md`
/ `_200_datenmodell.md` / `_300_prozesse.md` in `.docs/specs/`. ~99% entscheidungsfest — ‹…›-Stellen
gegen reales `wimus`-Schema verifizieren, im Report schärfen.

## Scope (Stufe 1, ein Modul)
1. **Kanal-Adapter-Architektur** `lib/kommunikation/` (channel.ts Interface + adapters/email.ts +
   adapters/whatsapp.ts) — der Rest des ERP spricht NUR das Interface, nie IMAP/GreenAPI direkt.
2. **E-Mail (Variante A):** ImapFlow (IDLE) + mailparser (Anhänge) + Nodemailer (SMTP). Multi-
   Postfach. KEIN EmailEngine/rustmailer.
3. **WhatsApp (GreenAPI):** Webhook eingehend, Senden (Text/Datei), DownloadFile (Medien),
   GetChatHistory. Rate-Limit-Schutz. Falls TB04-Sendeanbindung existiert → in Adapter überführen.
4. **Nachrichten-Schicht:** kom_nachrichten/kom_anhaenge/kom_konversationen (oder vorhandene
   `nachrichten`/`portal_nachrichten` erweitern — prüfen!). Dublettenschutz (extern_id unique).
4c. **Kontakt-zentriert (alle Kontakttypen):** Basis-Bezug jeder Nachricht = Kontakt (jeder Typ:
   Interessent/Bewerber/Makler/Handwerker/Lieferant/Eigentümer/Mieter), NICHT nur Mieter. Jeder
   Kontakt hat einen Kommunikations-Thread + dezentralen Reiter, auch ohne Immobilienbezug.
   Immobilien-Ableitung (Einheit/Objekt) nur bei Kontakten mit solchem Bezug. Kontakttyp/Rolle
   aus `kontakte` lesen (Feld real verifizieren: kontakt_typ/rolle; Mehrfach-Rollen möglich —
   prüfen ob Einzelfeld oder n:m), NICHT in der Kommunikation duplizieren.
4b. **Zentral + dezentral (kom_nachricht_bezug, n:m):** Nachrichten zusätzlich je Objekt/Einheit/
   Mieter/Vorgang sichtbar. Bezug primär über Kontakt + abgeleitet über Hierarchie (Mieter→
   Einheit→Objekt). WG-/Sammel-Nachricht erscheint bei WG/Einheit UND jedem Mieter. Dezentraler
   Reiter „Kommunikation" auf den Detailseiten; Ebenen-Umschalter „nur diese / inkl. untergeordnete".
   **Datenschutz:** untergeordnete-Sicht = Verwalter-Sicht; in Mieter-/Portal-Sicht kein Einblick
   in Privat-Kommunikation von Mit-Mietern (RLS + Bezugs-Filter).
5. **Baustein-System (kom_bausteine — ERSETZT kom_signaturen):** EINE Tabelle für Templates/
   Signaturen/Telefon-Skripte/Schnipsel (baustein_typ), kanal-gebunden, Scope-Fallback
   (akteur→projekt→firma→marke→workspace, je Scope ein ist_default, partieller UNIQUE-Index).
   Service baustein.ts: loeseBaustein (Fallback) + rendere (Platzhalter). Platzhalter: feste Daten
   + Custom Fields aus 008 (`{cf:feldschluessel}` → custom_field_werte) + `{signatur}`-Verweis.
   UI /einstellungen/bausteine (Liste nach Typ/Kanal/Scope, Editor + Vorschau, Default-Toggle).
   Beim Senden: Default vorgeschlagen, manuell überschreibbar. Auch in Automatiken (005) per ID.
5b. **Signaturen** (kom_signaturen): E-Mail jede Mail, WhatsApp erste/auto-Nachricht; Platzhalter.
6. **Konfig-UI** `/einstellungen/kommunikation`: Postfächer/Instanzen/Signaturen/Autoreply CRUD.
7. **Chat-/Inbox-UI** `/kommunikation`: fertiges React-Kit (chatscope ODER MinChat — im Report
   begründen), KEINE selbstgebauten Bubbles, KEINE Omnichannel-Plattform einbetten.
8. **Autoreply (statisch)** kom_autoreply_regeln + autoreply.ts: Bedingung→fester Text, Anti-
   Schleife. Upgrade-Pfad zu 0005 im Datenmodell beachten (kein zweites Regel-Modell).

## HARTE Anforderungen
- **Secrets:** IMAP-PW + GreenAPI-Token serverseitig verschlüsselt (crypto.ts, Schlüssel aus
  Server-Env), **write-only in UI** (nie zurückgeben), nie in Logs/Webhooks/Fehlern.
- **RLS** auf allen kom_*-Tabellen (mandant_isolation); eingehende Webhooks serverseitig dem
  richtigen Mandanten zuordnen vor dem Schreiben.
- **Speicherung blockiert nie:** Sendefehler → Status fehler + Retry-Queue (Beds24-Block-Muster).
- **Belegfoto-Anhänge → Kern-OCR** (`verarbeiteBeleg`), KEINE zweite OCR-Pipeline.
- **Keine Doppelung:** vorhandene Nachrichten-/Kontakt-/Vorgang-Tabellen + Medien-Ablage nutzen.

## Empfehlung Reihenfolge
E-Mail-Adapter zuerst (weniger Risiko), dann WhatsApp; UI + Autoreply zuletzt. Falls der Umfang
für einen Lauf zu groß ist: sauber bis zu einem Punkt fertig + Rest im Report parken (nicht
erzwingen), Folge-Prompt möglich.

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_kommunikation.md` — 4 Punkte (Gebaut mit echten Tabellen/
Feldern / Abweichungen / Offen / Rückfragen). Besonders: welche vorhandenen Tabellen real genutzt
wurden, UI-Kit-Wahl, GreenAPI-Anbindungsstand.
