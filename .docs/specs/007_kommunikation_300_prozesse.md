---
id: 0007
titel: Kommunikations-Schicht — Prozesse
modul: kommunikation
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 007_kommunikation_000_konzept.md
---

# 0007 — Kommunikations-Schicht — Prozesse & UI

> Status: Vorab-Spec (Soll), Bau folgt.

## 1. UI-Bereiche

| Bereich | Pfad | Aufgabe |
|---------|------|---------|
| Unified Inbox (zentral) | `/kommunikation` | kanalübergreifende Konversationsliste + Chatansicht |
| Kommunikations-Reiter (dezentral) | bei Kontakt/Objekt/Einheit/Mieter/Vorgang | alle Nachrichten zu diesem Kontext im Thread |
| Konfig Kommunikation | `/einstellungen/kommunikation` | Postfächer/Instanzen/Autoreply |
| Bausteine | `/einstellungen/bausteine` | Templates/Signaturen/Telefon-Skripte (Typ/Kanal/Scope) |

- **Zentral ↔ dezentral = eine Wahrheit, zwei Sichten.** Beide lesen dieselbe `kom_nachrichten`,
  dezentral gefiltert über `kom_nachricht_bezug`. Kein zweiter Datentopf.
- **Dezentraler Reiter „Kommunikation"** auf den Detailseiten von **Kontakt (jeder Typ:
  Interessent/Bewerber/Makler/Handwerker/Lieferant/Eigentümer/Mieter)** sowie Objekt / Einheit /
  Vorgang: zeigt die zu diesem Kontext gehörenden Nachrichten (E-Mail + WhatsApp gemischt) im
  Thread. Aus dem Reiter heraus direkt antworten/schreiben (Bezug wird automatisch gesetzt).
  Der Kontakt-Reiter ist die Basis — er existiert für JEDEN Kontakt, auch ohne Immobilienbezug.
- **Ebenen-Umschalter** (Objekt-/Einheiten-Ebene): „nur diese Ebene" ↔ „inkl. untergeordnete".
  - Objekt → „inkl. untergeordnete" zeigt auch alle Nachrichten seiner Einheiten + Mieter.
  - Einheit → „inkl. untergeordnete" zeigt auch die ihrer Mieter (z.B. WG-Mitglieder).
  - Filter nutzt `kom_nachricht_bezug` (`bezug_typ` + `quelle`).
- **Chat-/Inbox-UI:** fertiges React-Kit (`@chatscope/chat-ui-kit-react` ODER
  `@minchat/react-chat-ui`) — Konversationsliste + Nachrichten-Verlauf + Eingabe + Anhänge.
  An WIMUS-Design anpassen (MinChat via CSS-Variablen). KEINE selbstgebauten Chat-Bubbles.
- Kanal je Konversation visuell gekennzeichnet (E-Mail / WhatsApp), Anhänge inline.

## 2. Prozess: Eingehende Nachricht (beide Kanäle)

1. Adapter empfängt (IMAP IDLE bzw. GreenAPI-Webhook).
2. Server validiert Quelle (Postfach/Instanz → Mandant/Marke).
3. Persistenz `kom_nachrichten` (+ Anhänge), Dublettenschutz über `extern_id`.
4. Zuordnung: Absender-Adresse/Nummer → Kontakt (sonst „unbekannt", anlegbar). Thread →
   Konversation.
5. Belegfoto-Anhang → OCR-Übergabe (FiBu).
6. Autoreply-Prüfung (s. §5), falls Regel greift.
7. UI: Konversation erscheint/aktualisiert sich (ungelesen).

## 3. Prozess: Ausgehende Nachricht

1. Nutzer schreibt in der Inbox (oder System/Autoreply löst aus).
2. Signatur-Auflösung (§4) je Postfach/Instanz.
3. Adapter sendet (Nodemailer / GreenAPI). Rate-Limit-Schutz WhatsApp.
4. Persistenz mit Status; bei Fehler → `fehler` + Retry-Queue (blockiert ERP nie).
5. **Bezug setzen:** adressierte Empfänger als `kom_nachricht_bezug` (quelle=adressiert) +
   abgeleitete Bezüge über die Hierarchie (quelle=abgeleitet).

### 3.1 Prozess: WG-/Sammel-Nachricht (Mehrfach-Adressierung)
- Nutzer wählt als Ziel z.B. „WG / Einheit IS17.W3" (alle Mieter) ODER einzelne Mieter.
- Sende-Logik: pro realem Empfänger eine Zustellung über den Kanal (E-Mail an alle Adressen /
  WhatsApp an jede Nummer), aber EIN logischer Nachrichten-Datensatz mit MEHREREN Bezügen:
  je WG-Mieter `quelle=adressiert` + die Einheit/WG `quelle=adressiert` + Objekt `abgeleitet`.
- Sichtbarkeit: Nachricht erscheint beim WG-Thread (Einheit) UND bei jedem einzelnen Mieter.
  Einzeln (nicht-WG) adressierte Nachrichten erscheinen nur beim jeweiligen Mieter (+ via
  Vererbung bei Einheit/Objekt in der Verwalter-Sicht).

## 4. Bausteine (Templates, Signaturen, Telefon-Skripte)

### 4.1 Auswahl beim Senden (Scope-Fallback)
- Beim Verfassen schlägt das System den per Fallback aufgelösten **Default-Baustein** vor:
  `loeseBaustein(typ, kanal, akteur, projekt)` → `akteur → projekt → firma → marke → workspace`,
  erster `ist_default=true` gewinnt. Dropdown zeigt den Default vorausgewählt + Alternativen.
- Nach Auswahl: `rendere(baustein, kontext)` füllt Platzhalter mit echten Daten → editierbare
  Vorschau vor dem Absenden.

### 4.2 Platzhalter
- Feste Daten (`{mieter}`, `{objekt}`, `{betrag}`, `{datum}`, `{akteur}` …).
- **Custom Fields (008):** `{cf:<feldschluessel>}` → Wert aus `custom_field_werte` der Ziel-Entität.
- **Signatur-Verweis:** `{signatur}` → fügt die per Scope-Fallback aufgelöste Signatur ein.
- Fehlende Platzhalter → leer/Warnung, nie Roh-`{...}` im Versand.

### 4.3 Signatur-Verhalten (baustein_typ='signatur')
- **E-Mail:** an JEDE ausgehende Mail (Pflichtangaben Impressum/GF/HRB).
- **WhatsApp:** nur ERSTE Nachricht eines Verlaufs / automatische Nachricht — nicht unter jeder
  Chat-Nachricht.

### 4.4 Telefon-Skripte (baustein_typ='telefon_skript', kanal=telefon)
- Gesprächsleitfaden — wird in der UI angezeigt (z.B. beim sipgate-Anruf), NICHT versendet.
  Platzhalter werden zur Anzeige aufgelöst (Name/Objekt/Betrag des Gesprächspartners).

## 5. Prozess: Autoreply (Stufe 1, statisch — kein KI)

1. Eingehende Nachricht → `autoreply.ts` prüft aktive Regeln des betroffenen Postfachs/Instanz.
2. Bedingung: `immer` | `ausser_geschaeftszeiten` (Zeitfenster) | `stichwort` (Text matcht).
3. Greift eine Regel → automatische Antwort (Baustein `template` referenzierbar + Signatur) über
   den Adapter.
4. Schutz: pro Kontakt/Konversation nicht mehrfach in kurzem Fenster (Anti-Schleife);
   Autoreply nie auf Autoreply.
5. **Upgrade-Pfad (0005):** sobald Automatik-Engine existiert, übernimmt sie die Regel-
   Auswertung; Aktion „antwort_text senden" → „Engine/Agent rufen". Bausteine sind per ID auch
   in Automatiken nutzbar. Nichts wird weggebaut.

## 6. Prozess: Konfiguration (Konfig-UI)

- **Postfächer/Instanzen:** CRUD je Mandant/Marke. Zugangsdaten setzen (write-only); Test-
  Verbindung (IMAP/SMTP/GreenAPI-Status) anzeigen, ohne Secret zurückzugeben.
- **Bausteine** (`/einstellungen/bausteine`): Liste filterbar nach Typ/Kanal/Scope (Scope als
  Badge); Editor mit Platzhalter-Einfügung (Klick fügt `{...}` ein) + Live-Vorschau; Default-
  Toggle je Scope. Templates/Signaturen/Telefon-Skripte in einer Verwaltung.
- **Autoreply:** Regeln je Postfach/Instanz, Aktiv-Toggle, Zeitfenster/Stichwort.
- **Secrets:** Eingabefeld nur zum Setzen; gespeicherter Wert nie angezeigt (Maskierung).

## 7. Fehler-/Randverhalten

- Kanal nicht erreichbar (IMAP down / GreenAPI-Fehler) → Status sichtbar, Retry, ERP läuft weiter.
- GreenAPI Ban-Risiko: Rate-Limit-Schutz, Number-Warming-Hinweis in der Konfig-UI.
- Doppelte eingehende Nachricht (Webhook-Retry) → `extern_id`-Unique fängt ab.
- Unbekannter Absender → Konversation „unbekannt", Kontakt anlegbar.

## 8. Tests (Soll)

- Unit: Adapter-Interface (Mock IMAP/GreenAPI), Signatur-Auflösung, Autoreply-Bedingungen,
  Dublettenschutz, Crypto (ver-/entschlüsseln, write-only).
- RLS-Test: Nutzer A sieht keine Nachrichten von Mandant B.
- Integration: eingehende Mail/WA → Persistenz + Zuordnung + (optional) Autoreply.
- Anti-Schleife: Autoreply nicht auf Autoreply, nicht mehrfach.

## 9. Offen → Claude Code (Report)

1. Reihenfolge der Adapter (Vorschlag: E-Mail zuerst, dann WhatsApp — E-Mail weniger Risiko).
2. UI-Kit final wählen (chatscope vs. MinChat) — MinChat besser themebar, chatscope reifer.
3. Test-Postfächer/GreenAPI-Test-Instanz: liefert Max für Integrationstests.
4. Verbindung Unified Inbox ↔ bestehendes Kern-Channel-Routing (Lock-Mechanik) — andocken.
