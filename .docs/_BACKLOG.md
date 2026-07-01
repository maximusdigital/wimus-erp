# WIMUS ERP — Backlog / Ideenspeicher

> Sammelstelle für Ideen und Gedanken, die NOCH NICHT spezifiziert/gebaut sind.
> Hier wird gesammelt; Umsetzung später (dann als Vorab-Spec + Auftrag, separat).
> Jeder neue Gedanke kommt in die Ideen-Historie (neueste oben, mit Datum/Uhrzeit in **MESZ**) und wird
> bei Bedarf unten als ausgearbeiteter Eintrag verdichtet.
> Kein Bau-Auftrag — reiner Ideenspeicher.
>
> **Backlog→Log-Flow:** Wird ein Punkt zur Spec/zum Modul überführt, wird er hier
> ENTFERNT (Backlog bleibt schlank = nur offene Ideen) und in `_LOG.md` als Initial-Eintrag
> aufgenommen (mit Rückverweis auf die alte Backlog-Nr).

---

## Ideen-Historie (neueste oben)

> Prio-Spalte ist die EINE Prio-Wahrheit: **P1** (bald/Fundament) · **P2** (danach) ·
> **P3** (später/optional). Prio hier pflegen — sonst nirgends.

| Prio | Datum/Zeit (MESZ) | Idee | Eintrag |
|------|------------|------|---------|
| P3 | 2026-06-29 18:15 | PROJEKTE.PFAD füllen (materialisierter Pfad für die Projekt-Hierarchie): Spalte existiert real, ist aber überall NULL. Materialisierter Pfad = kompletter Weg von der Wurzel als String (z.B. AAP → "AAP", AAP-TOUR → "AAP/AAP-TOUR"), erlaubt schnelle „alles unter Projekt X inkl. Unter-Projekte"-Abfragen via `pfad LIKE 'AAP/%'` statt rekursivem parent_projekt_id-Klettern. Zweck: Drill-down in der Projekt-Erfolgsrechnung (#21-B5 Finanzauswertung) + Hierarchie-Filter. NICHT jetzt füllen (verfrüht, solange B5 nicht gebaut): erst Konvention festlegen (Trennzeichen / vs Punkt, kuerzel vs UUID), dann zusammen mit B5 füllen + per Trigger aktuell halten. Aus B0 herausgenommen. Gehört logisch zu #21-B5. | #23 |
| P1 | 2026-06-29 14:40 | ARCHITEKTUR-KNOTEN (beim 010-Bau entdeckt, 14:50 präzisiert): NICHT zwei konkurrierende Welten, sondern: Workspace→Firma→Projekt ist die BESCHLOSSENE Org-Struktur (erp-kern-Spec 000: „dreistufige Org-Hierarchie", „Org-Modell live") und app-seitig in Benutzung (Workspace-UI/API real). ABER: (a) als Migration NICHT getrackt — die „fehlende Migration 004" (V501-Fundament ~50 Tab. live-only, analog zu 005-Nachzug ins Repo holen); (b) Fachtabellen hängen noch an mandanten (Alt-Wurzel Phase 0), NICHT an projekt_id. Vor 010-Scope (der auf firma/projekt zielen MUSS, nicht mandant): erst 004 nachtracken + entscheiden wie objekte→projekt verdrahtet/mandant→projekt überführt wird. Eigene Vorab-Spec. 010-Spec liegt fertig, pausiert bis dahin. ENTSCHEIDUNG 14:55 (Max): mandant ABLÖSEN, projekt wird Wurzel (deckt sich mit Architektur TB01 „Multi-Projekt: RLS+projekt_id, Im Schema"). Mapping 1:1 auf Marken-Ebene: 4 Mandanten=4 Marken (WIMUS Hausverwaltung→WHV, ALFA APARTMENTS→AAP, ALFA CAMPUS→ACA, ALFA DEVELOPMENT→???). ABER Seed-006-INKONSISTENZ: ALFA DEVELOPMENT fehlt als Top-Projekt; stattdessen liegen dessen Bauvorhaben MFHSO+ABHS21A fälschlich auf Top-Level. FIX in Migration: ALFA DEVELOPMENT als 4. Marken-Top-Projekt anlegen, MFHSO+ABHS21A als ebene-1-Unterprojekte darunter (analog AAP→Touristen/Monteure). Dann mappt 1:1 sauber. Phasen-Strategie (umkehrbar): A Tracking 004 nachholen → B projekt_id additiv+nullable an Fachtabellen, Backfill aus mandant → C RLS modulweise mandant→projekt (Negativ-Tests) → D mandant_id droppen (Point of no Return, ganz am Ende). GRÖSSTE Migration im Projekt (~80 Tab., live, echte Daten). UPDATE 15:40 (DDL-Extraktion Report 1535): ÜBERRASCHUNG — projekt-Welt ist VIEL weiter als gedacht, KEIN leeres Gerüst. Viele neuere Module hängen BEREITS an firma_id (belege, fibu_buchungen/konten, kontierungsregeln, lieferanten, crm_deals/leads, beteiligungen) bzw. projekt_id (abteilungen, citytax_saetze, kommunikationskanaele, pipelines, vorlagen, kpi_werte, landingpages, funnels, projekt_channels) bzw. workspace_id (akteure, channels). NUR die ALTEN 002-Kerntabellen (objekte/einheiten/mietvertraege/vorgaenge/buchungen/kontakte/…) hängen noch an mandant_id. #21 ist also NICHT ~80-Tab-Umbau, sondern LÜCKE schließen zwischen zwei koexistierenden Welten — deutlich kleiner. Phase A ERLEDIGT: Migration 004_org_hierarchie.sql gebaut (idempotent, Live-Ist nachgezeichnet: workspaces/firmen/projekte inkl. CHECK-Wertelisten/RLS/Trigger; projektmanager-FK konditional). projekte hat bereits Spalten marke + pfad (materialisierter Pfad!) — hilft Scope-Vererbung. Nächste Phasen: B objekte etc. an projekt_id + Backfill aus mandant→marke-Projekt; C RLS umstellen; D mandant droppen. UPDATE 16:10: Phase-B-SPEC geschrieben (.docs/specs/021_org_migration_000_phase_b.md, v0.1.0 entwurf, NICHT gebaut — erst Gegenlesen). Entscheidungen Max: ZWEI Achsen (firma_id rechtlich + projekt_id operativ, Objekt kann Marke wechseln ohne Firma-Wechsel); gesellschaften→firmen 1:1 migrieren (gesellschaften abgelöst); Anker=objekte (Rest erbt über RLS-Elternkette). Phase B = B0 Seed-Fix (ALFA DEVELOPMENT als 4. Marken-Top + MFHSO/ABHS21A drunter) → B1 gesellschaften→firmen + FK-Umhängen (finanzierungen/veraeusserungen/reinvest/intercompany) → B2 projekt_id-Backfill → B3 Verifikation. BEREINIGT 16:45 (Spec v0.2.0): gesellschaft_id→firma_id DURCHGEHEND (Ablösung); „Marke" komplett raus inkl. Spalte projekte.marke; Projekte können eigene Bankkonten/FiBu-Teilbereiche (neuer Schritt B4, Scope offen); Auflösungswurzel=firma (jur. Person/Privatperson), mandant entfällt ersatzlos; mandant→firma n:1 möglich (AA+Campus evtl. 1 Firma/2 Projekte). Offen vor Bau: versteuerungsart-Wertemapping, mandant↔gesellschaft-Firma-Konsistenz, mandant_id-Tabellen ohne objekt-Pfad (firma_id/projekt_id je Tabelle), DB-Backup, DISTINCT-Firmenzahl, B4-Bankkonten-Design, projekte.marke befüllt?. | #21 |
| P3 | 2026-06-29 14:20 | Berechtigungen: Spaltenmasken (CLS) für hochsensible Felder (Reisepass/Meldeschein, IBAN, Mieter-Bankdaten) — maskierte Anzeige (z.B. letzte 4 Stellen) für Nutzer mit eingeschränktem Recht statt Klartext. Bewusst NICHT im Kernmodell (Feld-/Spaltenebene = Komplexität); nur für die wenigen wirklich sensiblen Felder, falls realer Bedarf. Nach 010 Stufe 2. | #20 |
| P3 | 2026-06-29 14:00 | Berechtigungen: „Teilen/Weiterleiten" (Datensatz an Dritte raus — Vorgang an Handwerker, Beleg an StB, Dokument extern) als SEPARATES orthogonales Recht, NICHT in der Stufen-Leiter kein/lesen/schreiben/freigeben (DSGVO-Trennung: Approval ≠ Teilen). Nach 010 Stufe 1–2. | #19 |
| — | 2026-06-29 12:10 | → IN BAU: 009/008 Stufe 2 — HistorieTab + Custom-Field-Werte auf 4 Kern-Detailseiten (objekte/einheiten/kontakte/vorgaenge). Aus #14 (HistorieTab) + 008-Detail-UI überführt → _LOG. Rest von #14 (weitere Lieferanten, Audit-Rollen, Retention) bleibt offen. | Prompt 1210 |
| P3 | 2026-06-29 11:35 | 009 FiBu-Lieferant Folge-Entscheidungen (aus Report): (a) kanonischen Mahnungs-Pfad festlegen, falls manuelle Maske künftig Mahnlauf-Endpoint nachzieht (sonst Doppel-Log); (b) „nur Mandant"-Lieferantenbelege ohne K1 — optional an firma_id/Buchungskreis hängen (neuer Bezugstyp organisation/firma) statt nur Mandant; (c) [aus Stufe-2-Report 1225] Firmen-Kontakte: Historie-Bezug künftig organisation statt Sammeltyp kontakt? — nur falls 009-Bezugsmodell person/organisation trennt. Alle nicht-blockierend. | #18 |
| P2 | 2026-06-29 10:40 | 007 Sendeweg-Folgepunkte: Consumer (Reply-UI/Autoreply) als Aufrufer von sendeWhatsapp, Retry-Job für status=fehler, KOM_SECRET_KEY in Deploy-Env, .env.local-Token-Cleanup nach Live-Test | #16 |
| P1 | 2026-06-29 10:40 | erp.m81s.de UNHEALTHY (Root 500, Webhook-Routen 404) — Live-Build hängt/kaputt, blockiert Empfang+Versand komplett; Deploy-Heilung nötig | #17 |
| P3 | 2026-06-29 00:30 | Deploy-Zugang/Weg für Claude Code klären: Auto-Deploy bei Push aktiv (Status quo reicht meist), CC hat keinen Deploy-Zugang; ggf. Coolify-Deploy-Webhook mit Guardrail wie /pg/query | #15 |
| P2 | 2026-06-28 12:00 | Beds24-Block ausgehend (Calendar-Sync ERP→Beds24): API-Client + roomId-Mapping + Loop-Schutz + Initial-Sync; aus Belegungs-Report (kein realer Client vorhanden) | #11 |
| P3 | 2026-06-28 19:30 | Autoreply als ERSTER Automation-Use-Case: statisch zuerst (kein KI), später Upgrade auf Agent | #7 |
| P2 | 2026-06-28 17:30 | Channel-Anbindung direkt über ERP: iCal-Export, HousingAnywhere (offiziell) | #1 |
| P2 | 2026-06-28 17:50 | FiBu-Rechnungsversand mit ZUGFeRD über E-Mail/WhatsApp (man.+auto) | #4 |
| P3 | 2026-06-28 18:30 | Automatik-Engine (HA-like, Trigger/Bedingung/Aktion), Hybrid mit n8n, Modul 005_automation | #7 |
| P3 | 2026-06-28 18:10 | Agenten-Modul / Orchestrierung (OpenClaw nur Idee, offen) | #6 |
| P3 | 2026-06-28 17:30 | Channel Stufe 3: WG-Gesucht/Kleinanzeigen (Scraping, ToS-Risiko bewusst) — Weg: Headless/Playwright+Stealth; CAPTCHA-Solving als Grenze | #1 |
| — | 2026-06-28 17:15 | Grundsatz „Mietobjekt = Mietobjekt, Laufzeit = nur MV-Ausgestaltung" → eine Belegung, Kanäle als Adapter | #0 |

> Hinweis: #1 ist gesplittet — iCal/HousingAnywhere = P2, WG-Gesucht/Kleinanzeigen = P3.
> #0 ist ein Grundsatz (kein Bau-Item) → keine Prio.

---

## 0. Verbindendes Prinzip
„Mietobjekt ist immer Mietobjekt; Laufzeit = nur Ausgestaltung des MV." → EINE Belegung,
EINE Listing-/Belegungs-Wahrheit im ERP, verschiedene Kanäle als Adapter obendrauf
(wie Beds24). Abstraktion `lib/channels/` mit gemeinsamem Interface + je Adapter.

---

## 1. Vermarktungs-Channels (auf Belegungs-Engine)

### Stufe 1 — iCal/ICS-Export (sauber, generisch)
- ERP exportiert pro Einheit einen iCal-Feed mit `blockedPeriods` aus der Belegungs-Engine.
- Jedes Portal (auch HousingAnywhere) kann abonnieren → Belegung blockt überall, ToS-konform,
  ohne Integration je Portal. Natürliche Erweiterung der Belegungs-Engine.

### Stufe 2 — HousingAnywhere (offiziell)
- JSON-Feed-Endpoint im ERP (HA zieht täglich) ODER REST-API (Listing create/update/hide/delete).
- Echte Listings: Preise (`flatPrice`/`monthlyPrices`), `blockedPeriods`, `facilities`, `images`,
  Adresse (passt zu getrennter ERP-Adresse). Auth Bearer/api_key.
- Vorbehalt: HA nimmt aktuell keine neuen Public-API-Partner → Feed-Weg nutzen.

### Stufe 3 — WG-Gesucht / Kleinanzeigen.de (KEINE offizielle API) — RISIKO
- Nur über Scraping/Automatisierung möglich (keine offizielle Anbieter-API).
- **ToS-Risiko bewusst akzeptiert (Max, 2026-06-28); rechtliche Prüfung (Recht-Mike) aufgeschoben.**
- **Weg (bevorzugt): Headless Browser via Playwright** (im Stack vorhanden, E2E) — füllt das
  Inserat-Formular wie ein Mensch. Robuster als inoffizielle API-Clients (bricht nur bei
  sichtbaren UI-Änderungen, nicht bei internen API-Änderungen; sieht aus wie echtes Browsing).
  Inoffizielle JSON-Clients (GitHub) = Fallback, fragiler.
- **Stealth/Vermeidung:** `playwright-extra` + Stealth-Plugin, damit CAPTCHAs gar nicht erst
  erscheinen (Vermeidung statt Lösung). Ggf. Residential-Proxy gegen IP-Erkennung.
- **GRENZE — CAPTCHA-Solving NICHT einbauen:** Wenn trotz Stealth regelmäßig CAPTCHAs kommen,
  ist das das **Stopp-Signal** für diese Plattform (Bot ist aufgeflogen), NICHT der Anlass, einen
  Solver (2Captcha/Anti-Captcha/CapSolver etc.) dazuzukaufen. CAPTCHA gezielt umgehen hebt eine
  aktiv gesetzte Schutzmaßnahme aus → rechtlich (§303a StGB / UWG) deutlich heikler, und das
  Wettrüsten gegen Plattform-Anti-Bot ist für einen Kleinverwalter nicht gewinnbar. Lieber den
  Kanal für die Plattform aufgeben als das Wettrüsten. (Analog Claude-Code-Leitplanke: an der
  richtigen Stelle sauber anhalten statt mit Gewalt fertig werden.)
- **Architektur-Leitplanke:** KAPSELN — eigener Headless-Worker/Service (n8n-getriggert), NICHT
  im ERP-Kern. ERP gibt nur Listing-Daten raus, Worker übersetzt in Formular-Ausfüllen. Flag
  „experimentell/ToS-Risiko", jederzeit abschaltbar ohne den sauberen Kern (iCal/HA) zu brechen.
- Technische Schuld: Bot-Erkennung wird besser → laufende Wartungslast (Selektoren, Stealth).

---

## 4. FiBu-RechnungsVERSAND mit ZUGFeRD (E-Mail + WhatsApp), manuell + automatisch
- Rechnungen mit ZUGFeRD/XRechnung erzeugen + versenden über E-Mail (Punkt 2) und/oder
  WhatsApp (Punkt 3); manueller UND automatischer Versand.
- **WICHTIGE ABGRENZUNG (offen, vor Bau klären):** FiBu-Architektur sagt „**Invoice Ninja =
  Ausgangsrechnungen**, FiBu-Modul = Eingangsbelege". Rechnungsversand ist AUSGANG → hängt an
  Invoice Ninja (TB16), nicht am FiBu-Eingangs-Modul. Frage: Wer erzeugt die ZUGFeRD-Ausgangs-
  rechnung — Invoice Ninja oder FiBu? Kein zweiter Erzeuger (keine Doppel-Kontierungslogik).
- FiBu hat den ZUGFeRD-Parser bereits eingangsseitig (`istErechnung`/`parseErechnung`) —
  ausgangsseitig wäre es ZUGFeRD-*Erzeugung* (anderer Weg).
- **Offen:** Erzeuger (Invoice Ninja vs. FiBu); Trigger Auto-Versand (z.B. KZV-Buchung →
  Rechnung → WhatsApp+E-Mail, steht teils schon in 001_erp_300 Kap.4); Versand-Log/Status.

---

## 6. Agenten-Modul (eigenes Modul, querschnittlich) — Orchestrierungs-Schicht
> NICHT „Support-KI". Ein separates Agenten-/Orchestrierungs-Modul für das GANZE ERP, das an
> Fachmodule ANDOCKT (Support, FiBu, Vorgänge, Reporting …). Fachmodule bleiben eigenständig
> + menschbedient; die KI füllt Rollen ZUSÄTZLICH aus (Akteure-Prinzip Mensch+KI).

### Bausteine
- **Tool-/Wahrheits-Layer** (`lib/agent-tools/`): verlässliche ERP-Funktionen als Agent-Tools —
  `istVerfuegbar` (Belegungs-Engine!), `getPreis`, `getGastBuchung`, `getHausregeln` etc.
  Harte Fakten IMMER live über Tools, NIE aus LLM-Gedächtnis (kein Halluzinieren von „frei").
- **Knowledge Base (RAG):** aus Vorhandenem — `einheit_hausregeln`, `gaestemappe_inhalte`
  (versioniert), `einheit_sicherheit` → durchsuchbar je Einheit. Wenig Neubau.
- **Trennung Pflicht:** Echtzeitdaten (Tools, deterministisch) ≠ Erklärwissen (RAG). Wie FiBu
  (deterministisch vs. LLM).
- **Orchestrierung:** koordiniert die vielen Agenten (Posteingang, Mahnwesen, FiBu, Reporting,
  Support, Revenue …). **OFFEN (Max: später entscheiden):** Framework noch offen — OpenClaw war
  nur eine Idee, nicht gesetzt. Tendenz analog Ticketing: lieber einbettbar/nah am ERP als
  schweres externes Standalone-Tool. Kandidaten beim Ausarbeiten: n8n (vorhanden) vs. einbettbare
  Agent-Library vs. Eigenbau. Nicht raten.
- **Leitplanken (kritisch):** Lesen/Auskunft = frei. Geldwirksam/verbindlich zusagen/Zugang
  gewähren = NIE autonom (Mensch-Freigabe/enge Schwelle). Sonst sagt KI falschen Preis zu /
  bestätigt belegte Einheit. (Analog Claude-Code-Leitplanken + FiBu-Gating.)
- **Eskalation:** ehrliches Aussteigen (Konfidenz <0.70, Beschwerde-Ton, rechtlich/geldwirksam)
  → Lock an Mensch (Kern-Mechanik existiert).
- **KI-Außenkommunikation loggen** (GoBD/DSGVO): wer/welche KI hat was zugesagt.

### Kanäle (ein Agent, viele Ein-/Ausgänge — erst wenn Tool-Layer steht)
- Text: E-Mail, WhatsApp, Beds24-OTA, Mieter-Portal.
- Sprache: Zwischenschritt Whisper-Transkript (Anruf/WhatsApp-Voice) → Agent → Text/TTS;
  später Echtzeit-Voice (Retell/Vapi).

### Reihenfolge
1. Support OHNE KI (Punkt 5) steht zuerst — robuste Basis.
2. Tool-/Wahrheits-Layer (braucht Belegungs-Engine).
3. KB durchsuchbar (aus Vorhandenem).
4. Erster Agent dockt an Support an (Text), mit Leitplanken + Eskalation.
5. Orchestrierung über mehrere Agenten; Sprache zuletzt.

> Bezug: deckt Kern-Architektur Agent 1 (Posteingang) + Agent 12 (Telefon-KI) ab, erweitert
> um ERP-Tool-Zugriff + KB. Phasen 6 (KI-Agenten) + 12 (Telefon).

---

## 7. Automatik-Engine — eigenes Modul 005_automation (querschnittlich)
> Entscheidung (Max, 2026-06-28): **Variante C (Hybrid)** + **eigenes Modul 005_automation**.
> Vorbild: Home Assistant Automations — Trigger → Bedingung → Aktion, zentral zusammenlaufend,
> aber im Teilbereich direkt anlegbar.

### Architektur (Hybrid)
- **ERP = Regelschicht + UI** (Regeln als Daten in Supabase, in der ERP-UI pflegbar).
- **n8n = Ausführungs-Arm** (Muskel). Einfache Regeln führt die Engine selbst aus; komplexe
  Multi-System-Flows (z.B. Beds24→Schloss→Tuya→WhatsApp→Rechnung) bleiben n8n-Workflows, die
  die Engine als Aktion *triggert*. KEIN Nachbau von n8n.

### Bausteine (universell, HA-Muster)
- **Trigger:** neue Buchung, Frist erreicht/fällig, Zahlungseingang (Bank-Abgleich!),
  Belegung geändert, Vorgang-Status, eingehende Nachricht (E-Mail/WhatsApp/OTA), Beleg verarbeitet,
  Check-in/Check-out, Schwellenwert (DSCR/Leerstand) …
- **Bedingung:** Marke/Mandant, Einheit-Typ, Betrag, Vertragstyp/Laufzeit, Wochentag/Zeitfenster,
  Objekt-Tag …
- **Aktion:** Nachricht senden (E-Mail/WhatsApp), Frist anlegen, Forderung erzeugen, Beds24 blocken,
  Vorgang (Reinigung/Wartung) anlegen, Rechnung versenden, n8n-Workflow auslösen, KI-Agent rufen …

### Zentral + dezentral (der HA-Clou)
- **Zentrale Übersicht:** alle Automationen an einem Ort (Liste/Status/Log, Aktiv-Toggle).
- **Im Teilbereich direkt anlegbar:** z.B. an der Einheit „bei Check-out → Reinigungs-Vorgang",
  in FiBu „bei Zahlungseingang → Mahnung stoppen", an Frist „X Tage vorher → WhatsApp". Beides,
  nicht entweder/oder.

### WICHTIG — vereinheitlicht Vorhandenes (nicht danebenstellen)
Heute existieren MEHRERE parallele, hartcodierte Automatik-Mechanismen:
Fristen-Engine (n8n täglich), Channel-Routing/`pipeline_phase_aktionen` (trigger_typ
bei_eintritt/nach_x_tagen), KZV-Vertrag-Automatik, Mahnlauf, BK-KI-Automatisierung.
005_automation soll diese **generalisieren** (wie BK-Kerne/Akteure/Forderungen vereinheitlicht
wurden) — nicht als weiterer paralleler Mechanismus. Migration bestehender Hardcode-Automatiken
auf die Engine: schrittweise, im Modul-Konzept planen.

### Leitplanken
- Geldwirksame/externe/verbindliche Aktionen (Rechnung, Zahlung, Zugang, Außenkommunikation)
  nie ungebremst-autonom — Schwellen/Freigabe (analog FiBu-Gating + Agenten-Leitplanken Punkt 6).
- Jede Automations-Ausführung geloggt (Audit/GoBD): welche Regel, welcher Trigger, welche Aktion,
  Ergebnis. Dry-Run/Test-Modus für neue Regeln.

### Erster konkreter Use-Case: Autoreply (statisch zuerst, KI später)
> Guter erster Testfall für die Engine — simpel, aber sofort nützlich. Macht die Trennung
> Automation vs. Agent konkret.
- **Statischer Autoreply (jetzt machbar, OHNE KI):** Trigger eingehende Mail/WhatsApp →
  Bedingung (außerhalb Geschäftszeiten / bestimmtes Postfach / Stichwort) → Aktion: fester
  Text senden (z.B. „Danke, wir melden uns am nächsten Werktag"). Deterministische Regel =
  Automatik-Engine in einfachster Form, kein Agenten-Modul nötig.
- **Nahtloser Upgrade-Pfad:** sobald KI-Agenten (#6) fertig, wird aus der Aktion „sende festen
  Text" die Aktion „rufe Agent" — Engine/Trigger/Bedingung bleiben, nur die Aktion wird
  intelligenter. Nichts wird weggebaut; statischer Autoreply ist das Fundament.
- Autoreply nutzt die Kanal-Signatur (#2/#3) bei ausgehender Nachricht.

### Offen (vor Bau)
- Datenmodell: `automationen` (trigger/condition/action JSONB?), `automation_runs` (Log).
- Trigger-Mechanik: DB-Events/Supabase Realtime/Webhooks vs. Polling (Fristen läuft schon täglich).
- Verhältnis zu Agenten-Modul (Punkt 6): Automation = deterministische Regeln, Agent = KI-Reasoning;
  Automation kann Agent als Aktion rufen. Sauber abgrenzen, nicht vermischen.
- Reihenfolge: nach Kommunikations-Fundament (Prio 1) + Belegungs-Engine; viele Trigger/Aktionen
  hängen daran (Zahlungseingang, Belegung, Nachrichten).
---

## 11. Beds24-Block ausgehend — Calendar-Sync ERP→Beds24 (P2)
> Aus Belegungs-Report 1100: `lib/integrations/beds24.ts` (ausgehend) existiert NICHT real,
> kein roomId-Mapping. Belegungs-Engine selbst steht (Migration 023). Dies ist der fehlende
> ausgehende Sync. Eigener Bau-Auftrag (Konzept-Claude recherchiert Beds24 V2 + macht Spec).

- **Ziel:** Bei ERP-Belegung (Buchung/MV/Sperre) auf gekoppelter Einheit → Kalender-Block nach
  Beds24 pushen (Doppelbuchung über Kanäle vermeiden). ERP bleibt Single Source of Truth.
- **Zu bauen:** `lib/integrations/beds24.ts` (V2 API-Client, Auth token+propKey, Calendar/
  Availability-Block-Endpoint); Feld `einheiten.beds24_room_id` (+ ggf. beds24_prop_id, additive
  Migration); Fehler-Retry via n8n (Beds24-Fehler blockiert ERP-Speicherung NIE — Hook-Feld
  `belegung_sperren.beds24_geblockt` existiert schon).
- **Loop-Schutz (wichtig):** ausgehende Blocks mit `quelle=erp` markieren; eingehender Beds24-
  Webhook prüft, ob es ein Echo des eigenen Blocks ist (idempotent über extern_id/Zeitraum) →
  ignorieren, keine neue Buchung ableiten.
- **Initial-Sync:** bestehende offene MV/Buchungen einmalig + idempotent rückwirkend nach Beds24
  blocken (kein Auto-bei-jedem-Start).
- **Offen:** Beds24 V2 exakter Endpoint/Auth verifizieren (Konzept-Claude recherchiert);
  Verhältnis zum vorhandenen eingehenden Webhook-Skeleton.
---

## 12. Kontakt-Rollen vereinheitlichen: ist_*-Flags → Typ-Zuordnung (P3)
> Aus Modul-008-Report: Doppelspur. `kontakte.ist_mieter/ist_eigentuemer/…`-Booleans (real von
> `lib/fibu` + `api/kontakte?rolle=` genutzt) bestehen parallel zu den neuen System-Kontakttypen
> (`kontakt_typen`/`kontakt_typ_zuordnung`). Bewusst NICHT erzwungen beim 008-Bau.

- **Ziel:** eine Wahrheit für „welche Rolle hat dieser Kontakt" — die n:m-Typ-Zuordnung.
- **Migrationsschritt:** ist_*-Flags → Typ-Zuordnung migrieren; Konsumenten (lib/fibu,
  api/kontakte?rolle=) auf Typ-Abfrage umstellen; Flags dann entfernen oder als generierte Sicht.
- **Risiko:** Logik hängt an den Flags → sorgfältig testen, eigener Auftrag, nicht nebenbei.
- **Solange nicht vereinheitlicht:** Flags = Wahrheit für Logik, Typen = CRM-Sicht; dürfen sich
  nicht widersprechen (beim Setzen synchron halten — im 008-Folgeauftrag beachten).
---

## 13. SICHERHEIT: /pg/-Endpoint öffentlich exponiert — absichern (P1)
> Aus Migrations-Report (2026-06-28): Der postgres-meta-Endpoint `POST https://supa.m81s.de/pg/query`
> ist öffentlich über HTTPS erreichbar und führt mit dem Service-Role-Key BELIEBIGES SQL inkl. DDL
> aus → der Service-Role-Key ist faktisch ein DB-Generalschlüssel über HTTP. Sicherheitsrelevant.

- **Risiko:** Wer den Service-Role-Key hat, hat Voll-Zugriff auf die DB über das Internet (kein
  Port 5432 nötig). Key-Leak = Total-Kompromittierung. Endpoint ist breiter exponiert als nötig.
- **Zu prüfen (Max):** Muss `/pg/` (postgres-meta, Studio-Backend) extern erreichbar sein? In den
  meisten Setups gehört es HINTER VPN / nur intern / hinter Studio-Auth — nicht offen im Netz.
  Optionen: Kong-Route für `/pg/` auf intern/VPN beschränken; oder per IP-Allowlist; oder Studio
  nur über VPN. Coolify/Kong-Konfig prüfen.
- **Solange offen:** Service-Role-Key strikt geheim (nur server-/skriptseitig, nie Client/Repo/
  Logs — steht schon in CLAUDE.md); /pg/query nicht breiter nutzen als nötig.
- **Zusammenhang #12-Migrationsweg:** /pg/query ist der gewählte künftige Einspielweg (mit
  Bestätigungs-Guardrail) — die Absicherung des Endpoints macht diesen Weg erst unbedenklich.
---

## 14. Modul 009 Stufe 2 — Lieferanten + Detailseiten + Rollen-Restriktion Audit (P2)
> Aus 009-Report: Fundament gebaut (Migration 028), folgende Verdrahtung geparkt.
> **Teil-Stand 2026-06-29:** FiBu-Lieferant (Teil 1) GEBAUT (Commit e99a90d). HistorieTab-Einhängen
> + Custom-Field-Detail-UI IN BAU (Prompt 1210). Beide → _LOG. Hier verbleiben nur die nicht
> durchgestrichenen Punkte.

- ~~**FiBu-Lieferanten** (zahlung_eingegangen/mahnung_versandt/beleg_verbucht)~~ — GEBAUT
  2026-06-29 (Commit e99a90d, Report 1135).
- **Weitere Aktivitäts-Lieferanten verdrahten** (Service `protokolliere()` steht, nur Aufrufe):
  Kommunikation (nachricht_gesendet/empfangen, mit 007) → Belegung (sperre_gesetzt/
  buchung_angelegt) → Zugang/Schloss. (FiBu s.o. erledigt.)
- ~~**HistorieTab in Detailseiten einhängen** (objekte/einheiten/kontakte/vorgaenge)~~ — IN BAU
  2026-06-29 (Prompt 1210, gemeinsam mit 008-Custom-Field-Detail-UI).
- **Rollen-Restriktion Audit-Ansicht (SICHERHEIT):** `/einstellungen/audit` ist aktuell nur
  Mandanten-RLS + authentifiziert — d.h. JEDER authentifizierte Nutzer des Mandanten sieht das
  Audit-Log. „Nur Verwalter/Admin" braucht den Rollen-Layer (real noch nicht vorhanden). Vor
  Echtbetrieb mit mehreren Nutzerrollen nachziehen. (P2 innerhalb dieses Punkts.)
- **audit_log_id-Kopplung** (Aktivität↔Audit-Eintrag): optional, Roadmap.
- **Retention-Job** audit_log (Default 10 J., DSGVO-Anonymisierung): eigener Schritt, vor
  Scharfschalten mit StB gegenchecken.
---

## 15. Deploy-Zugang/Weg für Claude Code klären (P3)
> Aus GreenAPI-Go-Live (2026-06-29): Webhook-Route lieferte 404, weil der main-Build noch nicht
> auf erp.m81s.de deployt war. Claude Code hat KEINEN Deploy-Zugang → konnte nur melden, nicht
> auslösen. Aktuell: Auto-Deploy bei Push ist aktiv (löst sich meist selbst), aber der Punkt ist
> wiederkehrend bei jeder Route-/Webhook-Änderung.

- **Ist-Stand:** Auto-Deploy bei Push auf `main` (Coolify) aktiv → neue Builds landen automatisch.
  Verzögerung zwischen Push und Live-Sein ist die Stolperfalle (Route noch 404 bis Build durch).
- **Zu klären:** Soll Claude Code einen Deploy aktiv anstoßen/verifizieren können, oder bleibt das
  bei Max?
  - Option A (Status quo): Auto-Deploy genügt; CC pusht, wartet, verifiziert dann (Route → 400
    statt 404). Kein CC-Deploy-Zugang nötig. Schlankste Lösung.
  - Option B: CC bekommt einen Weg, den Deploy-Status zu prüfen/anzustoßen (Coolify-API/Webhook) —
    analog /pg/query-Muster MIT Bestätigungs-Guardrail (Deploy ist ein Schreib-/Wirkakt).
- **Empfehlung:** Erstmal A (Auto-Deploy reicht meist). B nur, wenn das Warten-auf-Build real
  stört. Dann Coolify-Deploy-Webhook + Guardrail wie bei Migrationen.
- **Konvention bis dahin:** Nach einem Push, der eine neue Route/Webhook braucht, im Report
  vermerken „Deploy abwarten, dann Route verifizieren (z.B. 400 statt 404)" — kein Deploy raten,
  kein Zugang erfinden.
---

## 16. Modul 007 Sendeweg — Folge-Punkte (P2)
> Aus Sendeweg-Reports (2026-06-29 10:20/10:40): Der ausgehende WhatsApp-Sendeweg ist GEBAUT
> (`sendeWhatsapp()`, Token verschlüsselt, Rate-Limit, `nachricht_gesendet`-Historie, 394 Tests),
> aber NICHT live getestet — es fehlt ein Auslöser, und der Deploy hängt (#17).

- **Consumer/Trigger bauen:** `sendeWhatsapp()` ist die Service-API ohne Aufrufer. Erster
  Consumer = einfache Reply-Funktion (Inbox-/Vorgangs-Ansicht) ODER statischer Autoreply
  (`autoreply.ts`+`signatur.ts` vorhanden). Versand ist außenwirksam → bewusst erst mit konkretem
  Trigger + nach Deploy. **Bis dahin wurde keine echte WhatsApp gesendet.**
- **KOM_SECRET_KEY in der Deploy-Env (Coolify):** Decrypt braucht den Key serverseitig — aktuell
  nur in `.env.local`, NICHT in der Deploy-Umgebung. Ohne ihn schlägt das Entschlüsseln live fehl.
  (Max: noch zu setzen.)
- **`.env.local`-Token-Cleanup:** Der verschlüsselte DB-Weg steht; sobald live getestet, kann der
  Klartext-`GREENAPI_TOKEN` aus `.env.local` raus (zwei Secret-Kopien = Angriffsfläche). Max
  entscheidet — CC fasst `.env.local` nicht eigenmächtig an.
- **Retry-Job:** Sendefehler werden als `status=fehler`+`fehler_text` persistiert (Grundlage da);
  ein automatischer Retry (`maxSendeVersuche`) fehlt noch.
- **Anhänge ausgehend** (`sendFileByUrl`) — Stufe 2.
- **`an_adresse` eingehend** (aktuell null) optional aus der Instanz-Nummer nachtragen.
- **Baustein-System** (kom_bausteine, 007 v0.4.0) bewusst NICHT Teil des Roh-Sendewegs → kommt mit
  dem Baustein-Bau.
---

## 17. SICHERHEIT/BETRIEB: erp.m81s.de unhealthy — Deploy heilen (P1)
> Aus Sendeweg-Reports (2026-06-29): Die Live-Instanz `erp.m81s.de` antwortet mit **Root 500**
> und **Webhook-Routen 404**. Der Auto-Deploy (lt. Klärung aktiv) ist nicht durch / der Build
> hängt oder ist kaputt.

- **Wirkung:** Blockiert ALLES Live — kein WhatsApp-Empfang (Webhook 404 → GreenAPI läuft ins
  Leere/Queue), kein Versand (kein Live-Test möglich), App-Root liefert 500.
- **Zu prüfen (Max/Infra):** Coolify-Deploy-Log der ERP-App ansehen — hängt der Build, ist er rot,
  fehlt eine Env-Variable (z.B. `KOM_SECRET_KEY`, die beim Boot gelesen wird und sonst crasht)?
  Healthcheck/Container-Status in Coolify. Root 500 deutet auf einen Laufzeit-/Boot-Fehler, nicht
  nur fehlendes Deploy.
- **Zusammenhang:** Solange #17 offen ist, sind die 007-Empfang/-Versand-Wege (gebaut) tot. Hat
  Vorrang vor dem Consumer-Bau (#16) — ohne gesunde App kein Live-Test.
- **Geparkt von Max (2026-06-29):** bewusst später, aber als P1 markiert wegen Total-Blockade Live.
