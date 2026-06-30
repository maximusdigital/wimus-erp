# WIMUS ERP — Logbuch (zentrales Projekt-Changelog)

> Projektweites Logbuch: angelegte Module/Specs, Meilensteine, Backlog→Spec-Überführungen,
> Bau-Reports. Zeitstempel deutsche Ortszeit (MESZ/MEZ je Jahreszeit).
>
> **Zwei Sichten auf dieselben Einträge:**
> - **Teil A — Fortlaufend** (chronologisch, neueste oben): der Gesamtstrom des Projekts.
> - **Teil B — Nach Modul** (je Modul gruppiert): was ist mit einem bestimmten Modul passiert.
>
> **Verhältnis zu anderen Historien:** Die modul-internen Änderungshistorien (in jedem
> `*_000_konzept.md`) bleiben zusätzlich bestehen — `_LOG.md` ist die übergeordnete
> Projektsicht, nicht ihr Ersatz.
>
> **Backlog→Log-Flow (verbindlich):** Wird ein `_BACKLOG.md`-Punkt zur Spec/zum Modul,
> wird er aus dem Backlog ENTFERNT und hier aufgenommen (mit alter Backlog-Nr als Rückverweis) —
> in BEIDEN Sichten (Teil A + Teil B).

---

# Teil A — Fortlaufend (chronologisch, neueste oben)

## 2026-06-29

| Zeit (MESZ) | Modul | Vorgang | Referenz |
|-------------|-------|---------|----------|
| 10:40 | 007 kommunikation | **GreenAPI Sendeweg GEBAUT** (Commits b9bc589+c2e6df5, 394 Tests grün, keine Migration): Token AES-256-GCM verschlüsselt in green_api_token_verschluesselt (kritische Reihenfolge eingehalten), sendeWhatsapp()-Orchestrator (Instanz→decrypt→Rate-Limit 1500ms→senden→persist), persistiereAusgehend (Spiegel zu eingehend), nachricht_gesendet-Historie angedockt (009-dormant-Punkt erledigt). NICHT live getestet (kein Consumer + Deploy hängt). | Report 20260629_1040 |
| 10:20 | 007 kommunikation | **Sendeweg-Detail** (Commit b9bc589): persistiereAusgehend + send.ts; Consumer (Reply-UI/Autoreply) bewusst noch nicht verdrahtet (außenwirksam, erst nach Deploy). Deploy: erp.m81s.de unhealthy (Root 500, Webhook 404). | Report 20260629_1020 |
| 00:20 | 007 kommunikation | **GreenAPI Sendeweg beauftragt** — Token verschlüsselt ablegen (KOM_SECRET_KEY gesetzt) + sendeNachricht + persistiereAusgehend + nachricht_gesendet-Historie. | Prompt 20260629_0020 |
| 00:10 | 007 kommunikation | **GreenAPI Go-Live (Empfang):** kom_wa_instanzen-Zeile angelegt (Instanz 7105189176, Mandant ALFA APARTMENTS), Webhook auf ERP umgebogen (weg von n8n). Empfang bereit nach Auto-Deploy. Erst sauber auf n8n zurückgesetzt, dann nach Freigabe auf ERP. | Report 20260629_0010 |
| 09:30 | 007 kommunikation | **Baustein-System spezifiziert (v0.4.0):** kom_bausteine (Templates/Signaturen/Telefon-Skripte/Schnipsel, Scope-Fallback, Platzhalter feste Daten + Custom Fields 008 + Signatur-Verweis; ersetzt kom_signaturen). | Spec v0.4.0 |

## 2026-06-28

| Zeit (MESZ) | Modul | Vorgang | Referenz |
|-------------|-------|---------|----------|
| 20:30 | 009 historie | **Lieferant Kommunikation angedockt** (383 Tests grün, keine Migration): persistiereEingehend → protokolliere(nachricht_empfangen) für beide Kanäle (WhatsApp/E-Mail); protokolliere() um hierarchie erweitert (Nachricht erscheint auch in Einheit-/Objekt-Historie). DORMANT bis 007-Ingestion-Webhook live. | Report 20260628_2030b |
| 20:15 | 009 historie | **Modul GEBAUT + EINGESPIELT** (Migration 028 via /pg/query, 382 Tests grün): Audit-Log (Trigger 10 Whitelist-Tabellen, Akteur via request.jwt.claims statt SET LOCAL — Realitätsbefund, akteur_id ohne FK, append-only via Grant) + aktivitaeten/aktivitaet_bezug + Timeline-UI (zentral /historie + dezentral HistorieTab + Audit /einstellungen/audit). Lieferant vertrag_angelegt. Retention 10 J. dokumentiert. Stufe 2 geparkt. | Report 20260628_2015 · Spec v0.2.0 |
| 17:30 | 009 historie | **Modul aus Backlog überführt** (#9+#10) — ERP-weite Historie + Audit: Audit-Log per DB-Trigger (Whitelist kritischer Tabellen, alt/neu-JSONB, Akteur via Session-Var, append-only) + Aktivitäts-Historie (protokolliere-API, aktivitaet_bezug n:m wie 007) + Pipedrive-Timeline (zentral/dezentral). #10 Log-Konzept geklärt (5 Log-Arten zugeordnet). | ex-Backlog #9/#10 · Prompt 20260628_1730 |
| 17:00 | infra | **Alle Migrationen eingespielt + verifiziert:** 023 (Belegung) ✅, 024 (Suche pg_trgm + 13 GIN, von Max eingespielt) ✅, 027 (Felder) ✅. Verifikation via postgres-meta /pg/query (sieht pg_catalog). → Bank/Belegung/Suche/Felder alle LIVE. | Report 20260628_1645 |
| 16:00 | 008 felder | **Modul GEBAUT** (Migration 027, 375 Tests grün): Kontaktmodell durch Erweiterung (Person=kontakte, Organisation=organisationen), n:m-Typen + person_organisation, Custom Fields Variante C (id-Prefilter für 0006), Service `lib/felder/` + UI, System-Typen geseedet. lieferanten zweigleisig. Stufe 2 (Detail-UI/0006-Route) geparkt. App-Cutover public→wimus bestätigt erfolgt. | Report 20260628_1600 · Spec v0.2.0 |
| 23:30 | 008 felder | **Modul aus Backlog überführt** — Custom-Field-Schicht + Kontaktmodell: Person/Organisation getrennt (Pipedrive-Muster) + UI-pflegbare Typen (System-geschützt/frei), generische Custom Fields (Feldtypen Text/Zahl/Datum/Auswahl/Mehrfach/JaNein), je Feld filterbar (dockt an 006 an), für alle Entitäten. Speicher-Variante C (typisierte Spalten)/B (JSONB) offen an realer Last. | ex-Backlog #12 · Prompt 20260628_2330 |
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
| 2026-06-29 10:40 | Sendeweg GEBAUT (394 Tests grün): Token AES-256-GCM verschlüsselt, sendeWhatsapp() (decrypt→Rate-Limit→senden→persist), persistiereAusgehend, nachricht_gesendet-Historie (009-dormant erledigt). NICHT live (kein Consumer + Deploy unhealthy). Folge-Punkte → Backlog #16. |
| 2026-06-29 00:10 | GreenAPI Go-Live Empfang: kom_wa_instanzen angelegt (7105189176, ALFA APARTMENTS), Webhook auf ERP. Deploy unhealthy (Backlog #17). |
| 2026-06-29 09:30 | v0.4.0: Baustein-System (kom_bausteine: Templates/Signaturen/Telefon-Skripte, Scope-Fallback Akteur→Projekt→Firma→Marke→Default, Platzhalter feste Daten + Custom Fields 008 + Signatur-Verweis; ersetzt kom_signaturen). |
| 2026-06-28 22:40 | v0.3.0: kontakt-zentriert (alle Kontakttypen: Interessent/Bewerber/Makler/Handwerker/Lieferant/Eigentümer, Immobilienbezug optional, Rolle aus kontakte, Mehrfach-Rollen). |
| 2026-06-28 21:50 | v0.2.0: zentral/dezentral ergänzt (kom_nachricht_bezug n:m, Hierarchie-Ableitung, WG-Sammelnachricht, Ebenen-Umschalter, Datenschutz). |
| 2026-06-28 21:30 | Modul aus Backlog #2/#3/#3b/#5 überführt, Vorab-Spec angelegt (000/200/300). Bau folgt. |

## Modul 008 — felder (Custom Fields + Kontaktmodell)
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 16:00 | GEBAUT (Migration 027, v0.2.0, 375 Tests grün): Kontaktmodell durch Erweiterung (Person=kontakte, Organisation=organisationen), n:m-Typen + person_organisation, Custom Fields Variante C (id-Prefilter für 0006), Service+UI, System-Typen geseedet. lieferanten zweigleisig. Stufe 2 geparkt. |
| 2026-06-28 23:30 | Modul aus Backlog #12 überführt, Vorab-Spec angelegt (000/200/300). Bau folgt. |

## Modul 009 — historie (Audit + Aktivitäts-Historie)
| Datum/Zeit (MESZ) | Vorgang |
|-------------------|---------|
| 2026-06-28 20:30 | Lieferant Kommunikation angedockt (nachricht_empfangen, beide Kanäle); protokolliere() um hierarchie erweitert. Dormant bis 007-Ingestion. |
| 2026-06-28 20:15 | GEBAUT + EINGESPIELT (Migration 028 via /pg/query, v0.2.0, 382 Tests grün): Audit (Trigger 10 Whitelist-Tabellen, Akteur via request.jwt.claims, akteur_id ohne FK, Grant-append-only) + aktivitaeten/aktivitaet_bezug + Timeline (zentral/dezentral/Audit). Lieferant vertrag_angelegt. Retention 10 J. Stufe 2 geparkt. |
| 2026-06-28 17:30 | Modul aus Backlog #9+#10 überführt, Vorab-Spec angelegt (000/200/300). #10 Log-Konzept (5 Arten) geklärt. |

---

# Prozess-/Konventions-Meilensteine

| Datum | Vorgang |
|-------|---------|
| 2026-06-29 | Arbeitszyklus um KOMPLEXITÄTS-EINSCHäTZUNG erweitert (Schritt 1b, Right-sized process aus SDD-Plugin alfredoperez): trivial (≤3 Dateien, <10 Zeilen, kein neues Verhalten/Schema) → Fast-Path ohne Vorab-Spec/Prompt; sonst voller Pfad. Harte Leitplanken (Tests/Review/kein Raten) gelten IMMER, Migration nie Fast-Path. |
| 2026-06-28 | Migrations-Einspielweg = /pg/query (postgres-meta) mit Pflicht-Bestätigungs-Guardrail festgelegt (ersetzt 'nur manuell UI'). Sicherheitsfund: /pg/ öffentlich exponiert → Backlog #13 (P1, absichern). |
| 2026-06-28 | App-Cutover public→wimus bestätigt ERFOLGT (aus 008-Report); CLAUDE.md korrigiert. |
| 2026-06-29 | Arbeitszyklus um REVIEW-Subagent erweitert (neuer Schritt 5, jetzt 0–8): separate unbefangene Instanz prüft Diff+Spec vor Commit; kritische Findings blocken. Idee aus Superpowers (nur dieser Schritt, kein Plugin). |
| 2026-06-29 | _HISTORY.md → _LOG.md umbenannt (durchgehend: Datei + CLAUDE.md/INDEX/Backlog/Specs); 'Logbuch' ist bei WIMUS etabliert. Modul 009 heißt weiter 'historie'. |
| 2026-06-28 | _LOG.md (vormals _HISTORY) eingeführt (fortlaufend + nach Modul); Backlog→Log-Flow verbindlich. |
| 2026-06-28 | Fester Claude-Code-Arbeitszyklus (0–7) + „check"-Kurzbefehl in CLAUDE.md verankert. |
| 2026-06-28 | Prompt/Report-Symmetrie: .docs/prompts/ ↔ .docs/reports/, Schema JJJJMMTT_UHRZEIT_{prompt|report}_grobangabe.md (MESZ). |
| 2026-06-28 | git/Lese-/Test-Befehle als Permissions in .claude/settings.local.json (allow/ask/deny). |
| 2026-06-28 | _BACKLOG.md mit Prio-Spalte (P1/P2/P3) als eine Prio-Wahrheit eingeführt. |
| 2026-06-27 | Spec-as-Code-Workflow festgeschrieben: Specs führen Max+Konzept-Claude, Claude Code baut nur, Report als Feedbackschleife. |
