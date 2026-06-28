# WIMUS ERP — Projekt-History (zentrales Changelog)

> Projektweites Logbuch: angelegte Module/Specs, Meilensteine, Backlog→Spec-Überführungen,
> Bau-Reports. Zeitstempel deutsche Ortszeit (MESZ/MEZ je Jahreszeit).
>
> **Zwei Sichten auf dieselben Einträge:**
> - **Teil A — Fortlaufend** (chronologisch, neueste oben): der Gesamtstrom des Projekts.
> - **Teil B — Nach Modul** (je Modul gruppiert): was ist mit einem bestimmten Modul passiert.
>
> **Verhältnis zu anderen Historien:** Die modul-internen Änderungshistorien (in jedem
> `*_000_konzept.md`) bleiben zusätzlich bestehen — `_HISTORY.md` ist die übergeordnete
> Projektsicht, nicht ihr Ersatz.
>
> **Backlog→History-Flow (verbindlich):** Wird ein `_BACKLOG.md`-Punkt zur Spec/zum Modul,
> wird er aus dem Backlog ENTFERNT und hier aufgenommen (mit alter Backlog-Nr als Rückverweis) —
> in BEIDEN Sichten (Teil A + Teil B).

---

# Teil A — Fortlaufend (chronologisch, neueste oben)

## 2026-06-28

| Zeit (MESZ) | Modul | Vorgang | Referenz |
|-------------|-------|---------|----------|
| 15:30 | 007 kommunikation | **Fundament GEBAUT** (Migration 026, 364 Tests grün, Build grün): 8 kom_*-Tabellen (RLS, extern_id-Dublettenschutz, n:m-Bezug, Trigram); Logikkern crypto(AES-GCM,write-only)/signatur/autoreply(Anti-Schleife)/bezug; Adapter WhatsApp(native fetch + Webhook-Parser) + E-Mail(Nodemailer/ImapFlow/mailparser); inbox-Persistenz. kontakte-Rolle=ist_*-Booleans verifiziert; kom_* neu statt nachrichten. **Geparkt:** UI/API-Routen/Webhook-Endpunkt/dezentrale Reiter. UI-Kit-Empfehlung chatscope. | Report 20260628_1530 |
| 12:00 | 006 suche | **Such-Schicht GEBAUT** (Migration 024, 332 Tests grün): pg_trgm+GIN, lib/search, globale Suche ⌘K + Pro-Modul-Filter (Vorgänge). Stufe 1 ILIKE; mieter=kontakte; forderungen raus; FTS/similarity Roadmap. Spec v0.2.0. | Report 20260628_1130 |
| 11:00 | 001 erp-kern | **Belegungs-Engine GEBAUT** (Migration 023, 326 Tests grün): quellenübergreifende Verfügbarkeit (buchungen/MV/belegung_sperren) + Vorab-Check (warnt) + UI /belegung. MV-Ende inklusiv. Beds24-Block ausgehend geparkt. Spec v5.3.0. | Report 20260628_1100 |
| 10:00 | 002 fibu | **Bank-Abgleich-Ausbau GEBAUT** (Migration 022 eingespielt): FIFO-Kaskade verteileEinnahme + Guthaben, konfigurierbare Schwellen (bank_einstellungen), Vorfilter beide Quellen (Auto + bank_ignorier_muster), 318 Tests grün. Kanban-Drag-Smoke bestätigt. Spec v0.12.0. | Report 20260628_1000 |
| 21:30 | 007 kommunikation | **Modul aus Backlog überführt** — integrierte Kommunikations-Schicht (E-Mail Variante A: ImapFlow/mailparser/Nodemailer + WhatsApp GreenAPI als Kanal-Adapter, eine Nachrichten-Wahrheit, Signaturen, Konfig-UI write-only Secrets, Chat-UI-Kit, Autoreply statisch). v0.2.0 + zentral/dezentral (kom_nachricht_bezug n:m, WG-Sammelnachricht, Ebenen-Umschalter, Datenschutz). | ex-Backlog #2/#3/#3b/#5 · Prompt 20260628_2130 |
| 20:45 | 006 suche | **Modul aus Backlog überführt** — querschnittliche Such-/Filter-Schicht (DB-seitig pg_trgm+FTS, globale Command-K-Suche + Pro-Modul-Filter, Entitäts-Registry, RLS-konform). | ex-Backlog #8 · Prompt 20260628_2045 |
| 09:25 | 002 fibu | **Bank-Abgleich gebaut** (Nachtlauf, Migration 021): Import/Match/OP, eine Fuzzy-Engine (fuzzball), K1 real über objekte.kuerzel/einheiten.verwendungszweck_code, FIFO-OP, 314 Tests grün. Spec auf v0.11.0 nachgezogen. | Report 20260628_0925 |
| 09:25 | 004 ops | **Kanban-Nacharbeiten gebaut** (Nachtlauf, Migration 020): board_sort, 25/25 E2E grün. | Report 20260628_0925 |

---

# Teil B — Nach Modul gruppiert

## Modul 001 — erp-kern
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 12:00 | Belegungs-Engine GEBAUT (Migration 023, v5.3.0): quellenübergreifende Verfügbarkeit + Vorab-Check (warnt) + UI, MV-Ende inklusiv, 326 Tests grün. Beds24-Block ausgehend geparkt (eigener Auftrag). |
| 2026-06-28 17:15 | Belegungs-Engine-Spec vorab (v5.2.0): belegung_sperren, Verfügbarkeits-Logik, Beds24-Block. |

## Modul 002 — fibu
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 12:00 | Bank-Abgleich-Ausbau GEBAUT (Migration 022, eingespielt, v0.12.0): FIFO-Kaskade + Guthaben, konfigurierbare Schwellen, Vorfilter beide Quellen, 318 Tests grün. inhaber-Feld geplant. |
| 2026-06-28 09:25 | Bank-Abgleich gebaut (Migration 021): Import/Match/OP, fuzzball-Engine, FIFO-OP, 314 Tests grün. Spec v0.11.0. |

## Modul 004 — ops
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 09:25 | Kanban-Nacharbeiten gebaut (Migration 020): board_sort, 25/25 E2E grün. |

## Modul 006 — suche
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 12:00 | GEBAUT (Migration 024, v0.2.0, 332 Tests grün): pg_trgm+GIN, lib/search, globale Suche ⌘K + Pro-Modul-Filter (Vorgänge). Stufe 1 ILIKE; mieter=kontakte; forderungen raus; FTS/similarity/restl. Entitäten Roadmap. |
| 2026-06-28 20:45 | Modul aus Backlog #8 überführt, Vorab-Spec angelegt (000/200/300). |

## Modul 007 — kommunikation
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 15:30 | **Fundament GEBAUT** (Migration 026, 364 Tests grün): 8 kom_*-Tabellen (RLS/extern_id-Dublettenschutz/n:m-Bezug/Trigram), Logikkern (crypto AES-GCM write-only, signatur, autoreply Anti-Schleife, bezug), Adapter WhatsApp (native fetch + Webhook-Parser) + E-Mail (Nodemailer/ImapFlow/mailparser), inbox-Persistenz. kontakte-Rolle=ist_*-Booleans; kom_* neu statt nachrichten. Geparkt: UI/API/Webhook-Endpunkt/dezentrale Reiter (chatscope empfohlen). |
| 2026-06-28 21:50 | v0.2.0: zentral/dezentral ergänzt (kom_nachricht_bezug n:m, Hierarchie-Ableitung, WG-Sammelnachricht, Ebenen-Umschalter, Datenschutz). |
| 2026-06-28 21:30 | Modul aus Backlog #2/#3/#3b/#5 überführt, Vorab-Spec angelegt (000/200/300). Bau folgt. |

---

# Prozess-/Konventions-Meilensteine

| Datum | Vorgang |
|-------|---------|
| 2026-06-28 | _HISTORY.md eingeführt (fortlaufend + nach Modul); Backlog→History-Flow verbindlich. |
| 2026-06-28 | Fester Claude-Code-Arbeitszyklus (0–7) + „check"-Kurzbefehl in CLAUDE.md verankert. |
| 2026-06-28 | Prompt/Report-Symmetrie: .docs/prompts/ ↔ .docs/reports/, Schema JJJJMMTT_UHRZEIT_{prompt|report}_grobangabe.md (MESZ). |
| 2026-06-28 | git/Lese-/Test-Befehle als Permissions in .claude/settings.local.json (allow/ask/deny). |
| 2026-06-28 | _BACKLOG.md mit Prio-Spalte (P1/P2/P3) als eine Prio-Wahrheit eingeführt. |
| 2026-06-27 | Spec-as-Code-Workflow festgeschrieben: Specs führen Max+Konzept-Claude, Claude Code baut nur, Report als Feedbackschleife. |
