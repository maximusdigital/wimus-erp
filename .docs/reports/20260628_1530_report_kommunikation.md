# Report — Modul 007 Kommunikation (E-Mail + WhatsApp), 2026-06-28 15:30 MESZ

> Prompt: `20260628_2130_prompt_kommunikation-modul-aufbau.md`. Voller Arbeitszyklus.
> Sicherung: Tag `sicherung/vor-kommunikation-026-20260628`. **364 Tests grün** (334 → +30),
> **Build grün**. **Keine Spec-/_BACKLOG-Edits.** **SQL offen: Migration 026.**
>
> Umfang bewusst geschnitten (Prompt erlaubt „sauber bis zu einem Punkt + Rest parken"):
> **Fundament + Logikkern + beide Adapter (Code) gebaut**; **UI + API-Routen + Webhook-Endpunkt
> + dezentrale Reiter geparkt** (Folge-Prompt). Begründung unten.

## 1. Gebaut (mit echten Tabellen/Feldern)

### Datenmodell — Migration `026_kommunikation.sql` (additiv/idempotent, RLS, 8 Tabellen)
Alle `kom_*` **neu** angelegt (Begründung s. Abweichungen): `kom_postfaecher`, `kom_wa_instanzen`,
`kom_konversationen`, `kom_nachrichten`, `kom_anhaenge`, `kom_nachricht_bezug`, `kom_signaturen`,
`kom_autoreply_regeln`.
- **RLS `mandant_isolation`** auf allen 8 (via `public.user_mandanten`), `touch_updated_at()`-Trigger.
- **Dublettenschutz:** `ux_kom_nachrichten_extern (kanal, extern_id) WHERE extern_id IS NOT NULL`.
- **Bezug n:m:** `ux_kom_bezug (nachricht_id, bezug_typ, bezug_id)` + `idx_kom_bezug_ziel`.
- **Trigram-Index** auf `kom_nachrichten.text` (nur wenn `pg_trgm` da — Andockung Modul 0006).
- **Secrets-Spalten:** `passwort_verschluesselt`, `green_api_token_verschluesselt`,
  `oauth_config_verschluesselt` (NIE Klartext).
- `kom_signaturen`/`kom_autoreply_regeln`: `CHECK num_nonnulls(postfach_id, wa_instanz_id)=1`
  (genau ein Kanal je Zeile). `kom_nachrichten.ist_autoreply` (Anti-Schleife), `fehler_text`
  (Retry-Diagnose, nie Secrets), `status`-CHECK inkl. `warteschlange`/`fehler`.

### Logikkern `lib/kommunikation/` (rein/testbar)
- **`crypto.ts`** — AES-256-GCM, Schlüssel aus `KOM_SECRET_KEY` (Env, nie DB; Hex-64 oder
  Passphrase→SHA-256). `verschluessele`/`entschluessele` (authentifiziert → Manipulation erkannt),
  `maskiere()` für **write-only** API-Responses (`{gesetzt:boolean}`, nie der Wert).
- **`signatur.ts`** — Platzhalter `{absender}/{marke}/…`; E-Mail an JEDE Mail, WhatsApp nur
  erste/Auto-Nachricht; unbekannte Platzhalter bleiben stehen.
- **`autoreply.ts`** — statisch (`immer`/`ausser_geschaeftszeiten`/`stichwort`), **Anti-Schleife**
  (nie auf Autoreply, nicht mehrfach im Fenster `autoreplyFensterMinuten`). Upgrade-Pfad 0005:
  Tabelle bleibt Regel-Quelle, kein zweites Modell.
- **`bezug.ts`** — `leiteBezuege()`: Kontakt-Basis immer `adressiert`; Mieter→Einheit/Objekt
  `abgeleitet`; WG-Sammel: Einheit/WG `adressiert` schlägt `abgeleitet`; Dedup pro (typ,id).
- **`types.ts` / `channel.ts` / `config.ts`** — gemeinsame Typen, `ChannelAdapter`/`PollenderAdapter`-
  Interface (ERP spricht NUR das), zentrale Limits.

### Adapter (Code; live-Wiring s. Offen)
- **`adapters/whatsapp.ts`** — GreenAPI über **native `fetch` (keine neue Lib)**: `sendeNachricht`
  (Multi-Empfänger), `holeMedien` (DownloadFile-URL), `holeChatverlauf` (GetChatHistory),
  **`parseGreenApiWebhook()` rein/testbar** (Text + Bild/Datei+caption; ignoriert Status-Callbacks;
  wirft nie → Webhook-Retry-fest). `zuChatId()` Nummern-Normalisierung.
- **`adapters/email.ts`** — Variante A: **Nodemailer** (SMTP send), **ImapFlow + mailparser**
  (`holeNeue(seit)` Poll, Anhänge inline). Zugangsdaten kommen entschlüsselt herein, nie in Logs.
  Libs installiert: nodemailer 9.0.1, imapflow 1.4.3, mailparser 3.9.12.

### Persistenz `inbox.ts`
- `persistiereEingehend()` — idempotent über `extern_id`, Kontakt-Zuordnung (E-Mail→`email`,
  WhatsApp→`telefon_mobil`), Konversation finden/anlegen, Bezüge schreiben (`leiteBezuege`),
  Anhänge mit `ocr_status='offen'` für **Beleg-Kandidaten** (Bild/PDF → Kern-OCR, KEINE 2. Pipeline).
- Reine Helfer getestet: `normalisiereAdresse` (E-Mail `Name <a@b>` → `a@b`; WhatsApp → Ziffern),
  `istBelegKandidat`.

### Tests (+30, alle grün)
crypto (round-trip/IV/Manipulation/fehlender Key/write-only), signatur, autoreply (Anti-Schleife,
GZ, Stichwort, inaktiv), bezug (WG-Dedup, adressiert>abgeleitet), whatsapp-Webhook-Parser, inbox-Helfer.

### Verifizierte reale Tabellen/Felder
- **`kontakte`**: Rolle = **Boolean-Flags** (`ist_mieter/ist_eigentuemer/ist_dienstleister/
  ist_makler/ist_tippgeber/ist_bank`) — NICHT ein `kontakt_typ`-Feld (das ist nur `person|firma`).
  Mehrfach-Rollen also nativ via Flags. Kontaktadresse: `email`, `telefon_mobil`.
- **`vorgaenge`, `einheiten`, `objekte`, `mietvertraege`** (FK `mieter_id`, `einheit_id`) vorhanden.

## 2. Abweichungen (zur Spec)

- **`kom_*` neu statt `nachrichten` erweitern:** reale `wimus.nachrichten` ist zu dünn
  (kein `extern_id`/Anhang/Postfach/Konversation/Bezug; `richtung` nur `ein|aus`) → Erweitern hätte
  sie verbogen. `portal_nachrichten` ist mieter-portal-spezifisch. Beide Legacy unberührt; Spec
  erlaubt „Prefix `kom_`". → **Spec-konform.**
- **Reihenfolge:** Prompt empfahl „E-Mail zuerst". Gebaut wurde **beides als Code**; live getestet
  ist keiner (kein Zugang). WhatsApp passt webhook-nativ besser zu Next.js als ein IMAP-IDLE-Daemon
  — daher E-Mail-Empfang als **Cron-Poll (`holeNeue`)** statt Dauer-IDLE (vermeidet Daemon-Frage).
- **`kontakt_typ`/Rolle:** Spec ‹kontakt_typ/rolle› → real `ist_*`-Booleans (s.o.).

## 3. Offen (geparkt → Folge-Prompt) + SQL

- **SQL-Stop:** `026_kommunikation.sql` einspielen (8 Tabellen + RLS).
- **`KOM_SECRET_KEY`** in Server-Env setzen (sonst keine Secrets speicherbar).
- **Geparkt (Stufe 1b):**
  1. **Konfig-UI** `/einstellungen/kommunikation` (Postfächer/Instanzen/Signaturen/Autoreply CRUD,
     Secrets write-only via `maskiere()`).
  2. **Chat-/Inbox-UI** `/kommunikation` — **UI-Kit-Empfehlung: `@chatscope/chat-ui-kit-react`**
     (reifer, stabiler; MinChat besser themebar, aber kleiner gepflegt). Noch nicht installiert.
  3. **API-Routen + Webhook-Endpunkt** `/api/kommunikation/whatsapp/webhook` (Instanz-Validierung
     vor Schreiben), Send-Routen, Cron-Poll-Job für E-Mail (`holeNeue`).
  4. **Dezentrale „Kommunikation"-Reiter** (Kontakt/Objekt/Einheit/Vorgang) + Ebenen-Umschalter.
  5. **OCR-Übergabe** der Beleg-Anhänge an `verarbeiteBeleg` (Routing-Job; Hook in `inbox.ts` steht
     via `ocr_status='offen'`).
  6. **Retry-Queue** für Sendefehler (Status `fehler`/`warteschlange` vorhanden; Worker fehlt).

## 4. Rückfragen

1. **E-Mail-Empfang Host:** Cron-Poll (vorhanden, serverless-tauglich) ODER separater Dauer-Worker
   mit ImapFlow-IDLE (Echtzeit)? Empfehlung: erst Cron-Poll, IDLE später bei Bedarf.
2. **Medien-Ablage** der Anhänge: physische Bytes wohin? (`speicher_ref` ist vorbereitet) —
   Supabase Storage / Nextcloud / Paperless? Bisher nur Metadaten persistiert.
3. **GreenAPI-Sende-Anbindung (TB04):** existiert eine? Aktuell eigener Adapter (native fetch) —
   falls TB04 da ist, dort konsolidieren.
4. **Webhook-Validierung:** GreenAPI-Webhook-Token via Pfad (`webhook_token` in `kom_wa_instanzen`
   vorgesehen) ODER Header — Präferenz?
