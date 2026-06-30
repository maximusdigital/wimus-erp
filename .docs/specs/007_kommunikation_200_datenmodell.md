---
id: 0007
titel: Kommunikations-Schicht — Datenmodell
modul: kommunikation
erstellt: 2026-06-28
geaendert: 2026-06-28
gehoert_zu: 007_kommunikation_000_konzept.md
---

# 0007 — Kommunikations-Schicht — Datenmodell & Architektur

> Status: Vorab-Spec (Soll), Bau folgt. Im `wimus`-Schema, RLS-konform. Tabellen-/Spaltennamen
> mit `‹…›` gegen reales Schema verifizieren (s. Konzept „Offene Punkte"). Migrationen idempotent.

## 1. Architektur-Überblick (`lib/kommunikation/`)

```
lib/kommunikation/
  types.ts              gemeinsame Typen (Nachricht, Kanal, Anhang, Postfach, Instanz)
  channel.ts            Adapter-Interface (sendeNachricht/empfangeNachricht/holeMedien)
  adapters/
    email.ts            E-Mail-Adapter (ImapFlow + mailparser + Nodemailer)
    whatsapp.ts         WhatsApp-Adapter (GreenAPI REST + Webhook)
  inbox.ts              kanalübergreifende Inbox-Logik (Zusammenführung, Zuordnung)
  baustein.ts           Baustein-System: loeseBaustein (Scope-Fallback) + rendere (Platzhalter
                        feste Daten + Custom Fields 008 + Signatur-Verweis); ersetzt signatur.ts
  autoreply.ts          statische Autoreply-Auswertung (Stufe 1)
  crypto.ts             Secret-Ver-/Entschlüsselung (serverseitig)
  config.ts             Limits/Defaults (Poll-Intervalle, Retry, Rate-Limit-Schutz)
```

**Adapter-Interface** (`channel.ts`) — der Rest des ERP spricht NUR das, nie IMAP/GreenAPI direkt:

```ts
interface ChannelAdapter {
  kanal: 'email' | 'whatsapp';
  sendeNachricht(input: AusgehendeNachricht): Promise<SendeErgebnis>;
  // eingehend: Adapter pusht in kom_nachrichten (IMAP IDLE / GreenAPI Webhook)
  holeMedien(ref: MedienRef): Promise<Buffer>;
}
```

## 2. Tabellen

> Falls reale `nachrichten`/`portal_nachrichten` existieren und passen → erweitern statt neu
> (Claude Code prüft). Sonst Prefix `kom_` zur Kollisionsvermeidung.

### kom_postfaecher (E-Mail-Konten)
```
id PK, mandant_id FK ‹verifizieren›, marke ‹enum/FK›, bezeichnung, zweck (kontakt|support|belege),
imap_host, imap_port, smtp_host, smtp_port, benutzer,
passwort_verschluesselt (NIE Klartext, write-only in UI),
oauth_config_verschluesselt NULL, aktiv bool, erstellt_am, aktualisiert_am
```

### kom_wa_instanzen (WhatsApp/GreenAPI)
```
id PK, mandant_id FK, marke, bezeichnung,
green_id_instance, green_api_token_verschluesselt (write-only),
telefon, aktiv bool, status (z.B. authorized|notAuthorized), erstellt_am, aktualisiert_am
```

### kom_nachrichten (gemeinsame Wahrheit)
```
id PK, mandant_id FK, kanal (email|whatsapp), richtung (eingehend|ausgehend),
postfach_id FK NULL, wa_instanz_id FK NULL,            -- je nach Kanal
konversation_id FK,                                    -- Thread/Chat-Gruppierung
extern_id (Message-ID / GreenAPI idMessage, UNIQUE je Kanal — Dublettenschutz),
von_adresse, an_adresse, betreff NULL (Mail), text,
hat_anhaenge bool, status (gesendet|zugestellt|gelesen|fehler|empfangen),
kontakt_id FK NULL ‹verifizieren›, vorgang_id FK NULL ‹verifizieren›,
gesendet_am, empfangen_am, erstellt_am
```

### kom_anhaenge
```
id PK, nachricht_id FK, dateiname, mime_typ, groesse,
speicher_ref (Pfad/Key in vorhandener Medien-Ablage ‹verifizieren›),
ocr_status NULL (für Belegfotos → FiBu), erstellt_am
```

### kom_konversationen (Thread/Chat)
```
id PK, mandant_id FK, kanal, kontakt_id FK NULL, vorgang_id FK NULL,
betreff NULL, letzter_nachricht_am, ungelesen_anzahl, erstellt_am
```

### kom_nachricht_bezug (n:m — dezentrale Sicht, Mehrfach-Adressierung)
> Kern für „zentral UND dezentral": eine Nachricht kann mit MEHREREN Kontexten verknüpft sein.
> **Basis ist IMMER der Kontakt** (jeder Kontakttyp, nicht nur Mieter). Immobilienbezug
> (Einheit/Objekt) wird NUR bei Kontakten mit solchem Bezug über die Hierarchie abgeleitet —
> ein Makler-/Interessenten-Thread hat oft nur Kontakt-Bezug.
```
id PK, nachricht_id FK,
bezug_typ (kontakt|mieter|einheit|objekt|vorgang|wg),   -- kontakt = Basis, immer gesetzt
bezug_id (FK auf die jeweilige Entität ‹verifizieren: kontakte/einheiten/objekte/vorgaenge›),
quelle (adressiert|abgeleitet),   -- adressiert = direkt gerichtet; abgeleitet = via Hierarchie
erstellt_am
```
- **kontakt = Basis-Bezug**, immer gesetzt (jede Nachricht hängt an mindestens einem Kontakt).
- **mieter** ist fachlich ein Kontakt mit Rolle „Mieter" → dann zusätzlich Einheit/Objekt
  abgeleitet. Andere Rollen (Interessent/Makler/Eigentümer/Handwerker/Lieferant) → ggf. nur
  Kontakt-Bezug, oder Bezug zu Objekt/Vorgang ohne Einheit.
- **Adressiert** = die Nachricht ging direkt an diesen Kontext (Einzelkontakt ODER ganze WG).
- **Abgeleitet** = automatisch über die Hierarchie (Mieter→Einheit→Objekt).
- Eindeutigkeit: UNIQUE (nachricht_id, bezug_typ, bezug_id).

> Kontakttyp/Rolle lebt in `kontakte` (Feld ‹kontakt_typ/rolle› — real verifizieren; Mehrfach-
> Rollen möglich). Die Kommunikation LIEST die Rolle nur (z.B. für Filter „nur Makler-Threads"),
> hält sie NICHT selbst.

### kom_bausteine (ersetzt kom_signaturen — alle Vorlagen einer Nachricht)
> „Templates, Signaturen, evtl. anderes — alles Bausteine einer Nachricht." Eine Tabelle,
> mehrere Typen. Kanal-gebunden, Scope-Fallback, je Scope ein Default.
```
id PK, mandant_id FK (RLS),
baustein_typ (template|signatur|telefon_skript|schnipsel),
kanal (email|whatsapp|telefon|allgemein),
name, betreff NULL (nur E-Mail-Template),
inhalt TEXT (mit Platzhaltern, HTML/Text je Kanal),
scope_typ (akteur|projekt|firma|marke|workspace),
scope_id NULL,                                  -- NULL bei workspace; sonst FK auf Akteur/Projekt/Firma/Marke
ist_default bool,                               -- genau einer pro (typ, kanal, scope_typ, scope_id)
aktiv bool, erstellt_am, aktualisiert_am
```
- **Scope-Fallback (Auflösung):** `loeseBaustein(typ, kanal, akteur, projekt)` geht
  `akteur → projekt → firma → marke → workspace` durch, nimmt den ersten `ist_default=true`.
  Spezifischste gewinnt. Nutzer kann beim Senden manuell einen anderen wählen.
- **Default-Constraint:** partieller UNIQUE-Index auf (typ, kanal, scope_typ, scope_id) WHERE
  ist_default — max. ein Default je Scope-Kombination.
- **Signatur = `baustein_typ='signatur'`** — ersetzt die frühere `kom_signaturen`. E-Mail-Signatur
  an jede Mail, WhatsApp-Signatur nur erste/auto-Nachricht (Logik in signatur.ts/baustein.ts).
- **Telefon-Skript = `baustein_typ='telefon_skript'`, kanal=telefon** — Gesprächsleitfaden (kein
  versendbarer Text; in der UI angezeigt, nicht gesendet).

### kom_baustein_platzhalter — Verfügbare Platzhalter (Konzept, keine eigene Tabelle nötig)
- **Feste Daten:** `{mieter}`, `{objekt}`, `{einheit}`, `{betrag}`, `{datum}`, `{akteur}` … aus
  den realen Entitäten zur Sendezeit aufgelöst.
- **Custom Fields (008):** `{cf:<feldschluessel>}` — referenziert `custom_field_definitionen`
  (008) über den stabilen `feldschluessel`; Wert aus `custom_field_werte` der Ziel-Entität.
  Jedes in 008 angelegte Feld wird automatisch als Platzhalter nutzbar.
- **Signatur-Verweis:** `{signatur}` — fügt die per Scope-Fallback aufgelöste Signatur ein
  (Baustein referenziert Baustein).
- Auflösung in `baustein.ts` (rendere(baustein, kontext)) — fehlende Platzhalter → leer/Warnung,
  nie Roh-`{...}` im Versand.

### kom_autoreply_regeln (Stufe 1, statisch)
```
id PK, postfach_id FK NULL, wa_instanz_id FK NULL,
name, aktiv bool,
bedingung_typ (immer|ausser_geschaeftszeiten|stichwort),
bedingung_wert NULL (z.B. Stichwort, Zeitfenster JSONB),
antwort_text, erstellt_am
```
> Upgrade-Pfad 0005: diese Tabelle kann von der Automatik-Engine als Regel-Quelle übernommen
> werden (Aktion „antwort_text senden" → „Engine/Agent rufen"). Kein zweites Regel-Modell.

## 3. Indizes (idempotent)

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_kom_nachrichten_extern
  ON wimus.kom_nachrichten (kanal, extern_id);          -- Dublettenschutz
CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_konv
  ON wimus.kom_nachrichten (konversation_id, empfangen_am);
CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_kontakt
  ON wimus.kom_nachrichten (kontakt_id);
-- Trigram für Suche (Andocken an Modul 0006): über text/betreff/von_adresse
CREATE INDEX IF NOT EXISTS idx_kom_nachrichten_text_trgm
  ON wimus.kom_nachrichten USING gin (text gin_trgm_ops);
-- Bezug (dezentrale Sicht): schnelle Abfrage „alle Nachrichten zu Objekt/Einheit/Mieter X"
CREATE UNIQUE INDEX IF NOT EXISTS ux_kom_bezug
  ON wimus.kom_nachricht_bezug (nachricht_id, bezug_typ, bezug_id);
CREATE INDEX IF NOT EXISTS idx_kom_bezug_ziel
  ON wimus.kom_nachricht_bezug (bezug_typ, bezug_id, quelle);
```

## 4. Secrets (KRITISCH — CLAUDE.md-Pflichtregel)

- `passwort_verschluesselt` / `green_api_token_verschluesselt`: serverseitig
  ver-/entschlüsselt (`lib/kommunikation/crypto.ts`, Schlüssel aus Server-Env, NICHT in DB).
- UI: **write-only** — Feld setzen möglich, Wert NIE zurückgeben/anzeigen. API-Route gibt
  Secrets nie im Response aus.
- Kein Secret in Logs, Webhook-Payloads, Fehlermeldungen.

## 5. RLS

- Alle `kom_*`-Tabellen: RLS `mandant_isolation` (wie ganzes `wimus`-Schema).
- Nachrichten/Konversationen markengebunden; Nutzer sieht nur seinen Mandanten/seine Marke.
- Eingehende Webhooks (GreenAPI) ordnen serverseitig der richtigen Instanz/Mandant zu, bevor
  geschrieben wird.

## 6. Datenfluss eingehend/ausgehend

- **E-Mail eingehend:** ImapFlow IDLE je aktivem Postfach → neue Mail → mailparser (inkl.
  Anhänge) → `kom_nachrichten` + `kom_anhaenge` (Dublettenschutz via Message-ID) → Zuordnung
  Kontakt/Vorgang (Adresse → Kontakt) → Konversation.
- **E-Mail ausgehend:** Nodemailer über das Postfach-SMTP, Signatur angehängt, Status zurück.
- **WhatsApp eingehend:** GreenAPI-Webhook (`IncomingMessageReceived`) → Server validiert
  Instanz → `DownloadFile` für Medien → `kom_nachrichten`/`kom_anhaenge`.
- **WhatsApp ausgehend:** GreenAPI Send (Text/Datei), Rate-Limit-Schutz, Signatur bei
  erster/automatischer Nachricht.
- **Fehler/Retry:** Ausgehende Sendefehler dürfen ERP-Persistenz nicht blockieren → Status
  `fehler` + Retry-Queue (n8n oder interner Job), analog Beds24-Block-Muster.

### 6.1 Bezugs-Ableitung (zentral ↔ dezentral)
- Beim Persistieren wird je Nachricht der **adressierte** Bezug gesetzt (Kontakt/Mieter, bei
  WG-Rundnachricht mehrere + die Einheit/WG).
- Zusätzlich werden **abgeleitete** Bezüge geschrieben: über die ERP-Zuordnung des Kontakts
  (Mieter → aktuelle Einheit → Objekt) Einträge mit `quelle=abgeleitet`. So findet die
  Objekt-/Einheiten-Ansicht die Nachricht, ohne dass der Nutzer sie manuell verschlagwortet.
- Ändert sich die Zuordnung (Mieter zieht um), gelten neue Nachrichten der neuen Einheit/dem
  neuen Objekt; alte Nachrichten behalten ihren historischen Bezug (kein Rückschreiben).

### 6.2 Datenschutz bei Vererbung (WICHTIG)
- „Inkl. untergeordnete" auf Objekt-/Einheiten-Ebene ist eine **Verwalter-Sicht** (sieht alle
  Nachrichten darunter). In einer etwaigen Mieter-/Portal-Sicht darf ein WG-Mieter NICHT die
  private Einzelkommunikation eines Mit-Mieters sehen — nur an ihn adressierte + an die ganze
  WG gerichtete. RLS + Bezugs-Filter (`quelle`/`bezug_typ`) setzen das durch.

## 7. Anhänge → FiBu-OCR

- Belegfoto-Anhänge (Mail/WhatsApp) → `kom_anhaenge.ocr_status` → Übergabe an Kern-OCR
  (`verarbeiteBeleg`) → FiBu-Beleg. KEINE zweite OCR-Pipeline.

## 8. Offen → Claude Code (Report)

1. Reale `nachrichten`/`portal_nachrichten` vorhanden? → erweitern statt `kom_nachrichten` neu.
2. Reale Kontakt-/Vorgang-Tabellen + FKs (für Zuordnung).
3. Medien-Ablage: vorhandenes Storage nutzen (welches?).
4. GreenAPI-Sende-Anbindung (TB04) existiert? → in Adapter überführen, nicht doppeln.
5. Verschlüsselungs-Schlüssel-Quelle (Server-Env) bestätigen.
