# WIMUS ERP – Claude Code Anweisungen

## Projekt-Kontext

WIMUS ERP ist die digitale Schaltzentrale für die Württembergische Immobilien Management und Service GmbH (WIMUS). Es verwaltet mehrere Marken (ALFA CAMPUS, ALFA APARTMENTS, ALFA DEVELOPMENT, WIMUS Hausverwaltung) und deren Objekte, Mieter, Verträge, KZV-Buchungen, Finanzen und Prozesse.

**Eigentümer:** Dipl.-Kfm. Maxim Moser  
**Portfolio:** 27 Einheiten, 6,9 Mio EUR Marktwert, 957 TEUR Jahresmiete  
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Shadcn/UI + Supabase (self-hosted)  
**Live:** erp.m81s.de | Supabase: supa.m81s.de | Repo: github.com/maximusdigital/wimus-erp



## Arbeitsweise (Autonomie-Modus)
- **Aufträge eigenständig und vollständig durcharbeiten, ohne Zwischenrückfragen.** Darf über
  Nacht laufen (lokale Rechte vorhanden). Alles abarbeiten, was sauber geht.
- **Blocker NICHT raten.** Offene Entscheidungen / Widersprüche / Spec-Lücken nicht selbst
  zudichten, sondern **parken** und am Ende gesammelt im Report unter „Rückfragen" dokumentieren.
  Lieber einen Teil sauber fertig + Rest geparkt als etwas erzwingen.
- **Harte Leitplanken NIE umgehen, um „fertig" zu werden:** Git-Sicherung vorab; kein Commit
  ohne grüne Tests (`npm run test:run` + `npm run build`) — rote Tests werden gemeldet, nie
  auskommentiert/übersprungen; Migrationen idempotent; nichts doppelt (vorhandenes
  referenzieren, nicht neu bauen).
- **Vorhandenes vor Eigenbau:** fertige, geprüfte Libraries und bereits gebaute Helfer/Parser
  (z.B. `lib/utils/verwendungszweck.ts`, `lib/fibu/lieferant-match.ts`) nutzen statt neu bauen.

## Fester Arbeitszyklus je Auftrag (IMMER, in dieser Reihenfolge)

> **Kurzbefehl „check":** Sagt Max „check", durchläuft Claude Code diesen kompletten Zyklus
> (Schritt 0–8) für den/die anstehenden Prompt(s) — ohne dass die Schritte einzeln genannt werden.

Jeder Bau-Auftrag (Prompt in `.docs/prompts/`) wird in diesen Schritten abgearbeitet:

0. **CLAUDE.md LESEN** — diese Datei zuerst lesen (Regeln/Konventionen/Stand könnten sich
   geändert haben), dann erst loslegen.
1. **INDEX + PROMPT + SPEC LESEN** — zuerst `_INDEX.md` (Modul-Landkarte: Gesamtüberblick,
   welche Module existieren, Status/Version, Abhängigkeiten — damit klar ist, wo das anstehende
   Modul im System steht und woran es andockt). DANN den Prompt + die referenzierte(n) Spec(s) in
   `.docs/specs/` vollständig, zuerst das zugehörige `*_000_konzept.md` (Stand, Decisions, offene
   Punkte, Version). Der Index ersetzt NICHT die Spec — er ist die Landkarte, die Spec das Detail;
   nach dem Index gezielt in die relevante Spec springen (statt alle Specs zu scannen → Token).
   Bei markierten ‹…›-Stellen: gegen reales `wimus`-Schema verifizieren, nicht raten.
1b. **KOMPLEXITÄT EINSCHÄTZEN (Right-sized process)** — nicht jede Änderung braucht das volle
   Zeremoniell. Vor dem Bauen den Umfang einschätzen:
   - **TRIVIAL → Fast-Path:** ≤3 bestehende Dateien, <10 Zeilen, reiner Style-/Config-/Text-Tweak,
     KEIN neues öffentliches Verhalten / keine neue API / kein Schema-Change / keine Migration.
     Dann: direkt bauen (Schritt 3–6), KEIN Vorab-Spec/kein eigener Prompt nötig; im Report unter
     „Gebaut" knapp vermerken (1–2 Zeilen genügen). Spart Overhead, wo er nichts bringt.
   - **NORMAL → voller Pfad:** 4+ Dateien, neue Komponente/Service, neues öffentliches Verhalten/
     API, Schema-Change/Migration, oder querschnittliche Wirkung. Dann läuft der volle Zyklus mit
     Spec + Prompt + Report wie gehabt.
   - **Im Zweifel = NORMAL.** Lieber einmal zu viel den vollen Pfad als eine Schema-/API-Änderung
     ohne Spec durchrutschen lassen.
   - **WICHTIG — die harten Leitplanken gelten IMMER, auch im Fast-Path:** Git-Sicherung, grüne
     Tests (Schritt 4), Review-Subagent bei Code-Änderungen (Schritt 5), kein Raten, nichts
     doppeln. Der Fast-Path spart NUR das Spec-/Prompt-Zeremoniell — NIE die Qualitätssicherung.
     Eine Migration ist NIE Fast-Path (immer voller Pfad + /pg/query-Guardrail).
2. **SICHERN** — Git-Sicherung vorab (Commit/Tag des Ist-Stands), bevor Änderungen beginnen.
3. **ENTWICKELN** — bauen wie in der Spec; vorhandene Entitäten/Helfer referenzieren, nichts
   doppeln; Migrationen idempotent; sequenziell (ein Feature nach dem anderen).
4. **TESTEN** — `npm run test:run` + `npm run build`. **Rote Tests werden gemeldet, NIE
   auskommentiert/übersprungen.** Kein Commit ohne grün.
5. **REVIEW (Subagent)** — vor dem Commit prüft ein SEPARATER Review-Subagent (eigene Instanz via
   Task-Tool, frischer Kontext = unbefangen, NICHT der bauende CC selbst) den Build. Übergeben
   werden: der Diff (`git diff`) + die zugehörige Spec + der Bau-Prompt. Der Subagent prüft gegen
   eine feste Checkliste und meldet Findings nach Schweregrad:
   - **Spec-Treue:** Tut der Code, was die Spec verlangt? Abweichungen ohne Begründung?
   - **Keine Doppelung:** Wurde Vorhandenes referenziert statt neu gebaut (Kern-Entitäten, Libs)?
   - **Konventionen:** RLS/mandant_isolation gesetzt? Migrationen idempotent? Secrets nie im Klartext?
   - **Robustheit:** Fehler-/Blockier-Verhalten wie gefordert (z.B. Logging blockiert nie)?
   - **YAGNI/Over-Engineering:** Einfachste Lösung, die die Spec erfüllt — kein Goldrand?
   **Schweregrad-Regel:** KRITISCHE Findings (Spec-Bruch, fehlende RLS, Secret-Leak, Doppelung
   von Kernlogik) BLOCKEN den Commit → CC bessert nach (zurück zu Schritt 3), dann erneut Review.
   Kleinere Findings (Stil, Naming, kleine Redundanz) blocken nicht → wandern in den Report unter
   „Abweichungen/Offen". Der Review-Befund (Subagent-Urteil + behobene/offene Findings) wird im
   Report kurz dokumentiert. KEIN Mensch-Gate — der Subagent ist die unabhängige Prüfinstanz,
   der Zyklus bleibt autonom.
6. **COMMITTEN** — bei grün UND ohne kritische offene Review-Findings: `git add` / `commit` /
   `push origin main` selbstständig (Permission erteilt, kein force-push). Aussagekräftige
   Commit-Message.
7. **REPORTEN** — Report schreiben: `.docs/reports/JJJJMMTT_UHRZEIT_report_grobangabe.md`
   (MESZ/MEZ je Jahreszeit), 4 Punkte: (1) Gebaut mit echten Tabellen/Feldern · (2) Abweichungen
   (inkl. Review-Findings) · (3) Offen · (4) Rückfragen. Report committen + pushen.
8. **PLAN PFLEGEN** — den Auftrags-/Phasenstand aktualisieren (Stand-Sektion unten / Phase als
   erledigt markieren). **NICHT** die Specs in `.docs/specs/**` editieren (das macht
   Konzept-Claude über den Report-Feedback-Loop) und **NICHT** `_BACKLOG.md` anfassen.

Blocker/offene Entscheidungen werden NICHT geraten, sondern in Schritt 7 unter „Rückfragen"
geparkt. Lieber Teil sauber fertig + Rest geparkt als etwas erzwingen.

## Spec-Arbeitsteilung (verbindlich)
- **Specs führen Max + Konzept-Claude (Chat).** Claude Code BAUT nur — fasst KEINE Spec-Dateien
  an (kein Edit an `.docs/specs/**`) und NICHT `_BACKLOG.md`.
- **Prompts** (Aufträge an Claude Code) liegen in `.docs/prompts/`, Schema
  `JJJJMMTT_UHRZEIT_prompt_grobangabe.md` (MESZ). **Reports** (Rückkanal) liegen in
  `.docs/reports/`, Schema `JJJJMMTT_UHRZEIT_report_grobangabe.md` (MESZ) — symmetrisch.
- **Jeder Bau-Auftrag endet mit Report** (4 Punkte: Gebaut mit echten Tabellen/Feldern ·
  Abweichungen · Offen · Rückfragen). Report = Feedbackschleife: Konzept-Claude gleicht damit
  die Spec gegen die gebaute Realität ab.

## Spec-System (maßgeblich)
- **`_INDEX.md` zuerst lesen** — Modul-Landkarte (alle Module mit Status/Version/Specs/
  Abhängigkeiten + Doku-Landkarte). Gibt den Gesamtüberblick, bevor man in einzelne Specs springt.
  Pflege: Konzept-Claude (wie `_LOG`/`_BACKLOG`).
- Specs liegen als **Spec-as-Code (Markdown)** unter `.docs/specs/` als FLACHE Dateien
  (Schema `MMM_kuerzel_DDD_name.md`): Doc-Nummern `000_konzept` · `100_architektur` ·
  `200_datenmodell` · `300_prozesse` · `400_design` · `500_migration` · `600_tests`.
- **Vor jeder Modul-Arbeit das zugehörige `*_000_konzept.md` lesen** (Stand/Decisions/offene
  Punkte/Version). Modul-Version lebt nur dort; Git macht die Versionierung.
- Module: `001_erp` (Kern/Fundament), `002_fibu` (Belegerkennung/Kontierung), `003_crm`,
  `004_ops` (Vorgänge/Plantafel), `005_automation` (geplant), `006_suche`, `007_kommunikation`,
  `008_felder` (Custom Fields + Kontaktmodell), `009_historie` (Audit + Aktivität).
- **Projekt-Doku:** `_INDEX.md` (Landkarte) · `_LOG.md` (Changelog, Teil A chronologisch +
  Teil B nach Modul) · `_BACKLOG.md` (offene Ideen P1/P2/P3) · `_NOTE_*.md` (Schnipsel). Konzept-
  Claude pflegt alle drei `_`-Dateien; Claude Code fasst sie NICHT an (wie `.docs/specs/**`).
- Alte Word-Specs sind nach `.docs/ALT/` archiviert (nur Referenz, nicht maßgeblich).
- UI-Konventionen: `001_erp_400_design.md` (Shadcn + **Recharts/shadcn-charts** + WIMUS Custom).

---

## Datenmodell-Stand (v5)

**Maßgebliche Spec:** `.docs/specs/` (`001_erp_200_datenmodell.md` + `001_erp_000_konzept.md`). Alte Word-Docs unter `.docs/ALT/` nur als Referenz.

- **Schema `wimus`** (search_path = `wimus, public`), Plural, kein Prefix
- **Zieldatenmodell: 82 Tabellen** in 5 Gruppen (Kern · Verträge/Buchungen/Bank · Objekt-Details/Ausstattung/Zähler/Custom Fields · Steuer/AfA/Szenarien · Vorgänge/Workforce/Vertrieb)
- Migration `supabase/migrations/002_vollstaendiges_schema.sql` legt das `wimus`-Schema **additiv** an (das bestehende `public`-CRUD bleibt unberührt). Anwendung über Supabase SQL-Editor (DB-Port bleibt geschlossen).
- **Konventionen:** Adresse IMMER getrennt (`strasse, hausnummer, plz, stadt, stadtteil, land`) · Anrede `Herr/Frau/Firma/Keine` · `created_at`/`updated_at` auf allen Tabellen (Trigger) · `mandant_id` auf allen Kerntabellen · RLS `mandant_isolation` auf allen Tabellen · Aktenzeichen auto via DB-Trigger (`vorgaenge`) · 12 Seed-Rollen
- **5 polymorphe Referenzen** (`bezug_typ` + `bezug_id`): `versorgervertraege`, `zaehler`, `custom_field_werte`, `objekt_emails`, `geraete`
- **Versionierte Tabellen** (`gueltig_ab`): `einheit_hausregeln`, `einheit_sicherheit`, `gaestemappe_inhalte`
- **Zwei PIN-Codes je Buchung:** `keybox_pin` (statisch, Hauszugang aus `einheiten.keybox_pin_statisch`) ≠ `apartment_pin` (TTLock, dynamisch je Buchung)

**Neu seit Phase 1** (über die 4 CRUD-Entitäten hinaus): gaestemappe_inhalte, einheit_bettenstruktur, einheit_fotos, einheit_pois, einheit_sicherheit, stornierungsbedingungen, zertifikate_lizenzen, versorgervertraege, zaehler, zaehlerstaende, zaehler_umrechnungen, objekt_emails, custom_field_definitionen, custom_field_werte, intercompany, ma_profile, ma_verfuegbarkeit, objekt_zuweisungen, einsaetze, auftrag_zuweisungen, checklisten_vorlagen, checklisten_positionen, checklisten_ausfuehrungen, checklisten_ergebnisse, pipelines, pipeline_phasen, deals, vertriebspartner, maklervertraege, expose_varianten, interessenten, besichtigungen, provisionen, bewertungen, incident_reports, citytax_buchungen, nachrichten, vorlagen, filter_profile, geraete, wartungsintervalle, versicherungen.

> Hinweis: v5 deklariert 82 Tabellen; der Fließtext spezifiziert ~40 mit Spalten (Gruppensummen ergeben 77). Migration 002 implementiert alle namentlich genannten Tabellen (76) vollständig mit FK + RLS + Indizes. Die genaue 82-Enumeration wird ergänzt, sobald die vollständige Tabellenliste vorliegt. **App-Cutover public→wimus ist ERFOLGT (Stand 2026-06-28): die App läuft real auf `wimus`** (`lib/supabase/server.ts` Default `db.schema=wimus`; Seiten/APIs chainen `.schema("wimus")`). Das alte `public`-CRUD ist abgelöst.

---

## Architekturprinzip: Schaltzentrale

WIMUS ERP ist das Cockpit – keine Eigenentwicklung von Funktionalität die es als fertiges Open-Source-Modul gibt.

### Fertige Module (API-Anbindung, NIEMALS nachbauen)

| Funktion | Tool | Anbindung |
|----------|------|-----------|
| DMS/OCR | Paperless-ngx | REST API + Webhook |
| Unterschriften | DocuSeal | REST API + Webhook |
| Rechnungen/DATEV | Invoice Ninja | REST API |
| Support/Ticketing | Zammad | REST API + iFrame/SSO |
| Automatisierung | n8n | Webhook/HTTP |
| Dateispeicher | Nextcloud WebDAV | WebDAV |
| Kalender | Nextcloud CalDAV | CalDAV |
| Bauprojekte/Gantt | OpenProject | REST API |
| Zeiterfassung | Kimai | REST API |
| Urlaubsverwaltung | urlaubsverwaltung.cloud | REST API |
| Lohnabrechnung | ABS-RZ absPortal | CSV-Export |
| KZV Channel | Beds24 | Webhook + REST API |
| Dynamic Pricing | Pricelabs | API → Beds24 |
| Zugänge | TTLock (G5-Gateway) | REST API |
| Smart Home | Tuya Cloud API | REST API |
| WhatsApp | GreenAPI | REST API + Webhook |
| SMS | seven.io | REST API |
| Telefon | sipgate | REST API |
| KI-Telefon (Phase 2) | Retell AI | Webhook → n8n |
| Post digitalisieren | Caya | Webhook → Paperless |
| CRM | amoCRM | REST API + Webhooks |
| KI-Agenten | Claude API (Anthropic) | REST API |

### Was wir selbst bauen (nur das Einzigartige)
- Immobilienspezifische Business-Logik (Objekte, Einheiten, Verträge, KZV-Buchungsflow)
- Kautionsabrechnung, Mahnwesen-Logik, KdU-Checks
- DCF-Kalkulator, Phasenmodell, Finanzierungsrechner
- Steuerfristen-Tracking (15%-Grenze, 10J-Frist, 3-Objekt-Grenze, §6b)
- Dashboard, Reporting, Pipelines, Plantafel
- Bank-Präsentation / Selbstauskunft PDF

---

## Pflichtregeln (keine Ausnahmen)

### Datenbank
```sql
-- JEDE Kerntabelle hat mandant_id
-- RLS auf ALLEN Tabellen von Tag 1
-- Beispiel:
ALTER TABLE objekte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mandant_isolation" ON objekte
  USING (mandant_id = (SELECT mandant_id FROM user_mandanten WHERE user_id = auth.uid()));
```

- `mandant_id` als Fremdschlüssel auf JEDER Kerntabelle
- RLS (Row Level Security) auf ALLEN Tabellen aktivieren
- Service-Role-Key NUR in serverseitigen API-Routen (`app/api/`)
- NIEMALS Service-Role-Key im Frontend/Client-Code
- Migrations immer als vollständige SQL-Dateien in `supabase/migrations/`
- KEINE iterativen Schema-Änderungen ohne Migration
- **Einspielweg = `/pg/query` (postgres-meta) MIT Bestätigungs-Guardrail.** Der direkte DB-Port
  (5432) ist von außen zu. Schreibendes Einspielen läuft über den postgres-meta-Endpoint
  `POST https://supa.m81s.de/pg/query` (Service-Role, kann DDL). **Pflicht-Guardrail:** Vor JEDEM
  schreibenden Migrations-Lauf zeigt Claude Code Max die exakte auszuführende SQL und holt eine
  ausdrückliche Freigabe ein — der `/pg/query`-Weg darf die `ask`-Bestätigung NICHT still umgehen
  (ein `node`-Skript liefe sonst als `allow`). Reihenfolge: (a) `.sql` in `supabase/migrations/`,
  (b) SQL Max zur Freigabe zeigen, (c) nach „ja" über `/pg/query` einspielen, (d) verifizieren
  (`/pg/query` sieht auch `pg_catalog`/`pg_extension`/`pg_indexes`). Ohne Freigabe: nur die fertige
  SQL + Verifikations-Queries liefern, Max spielt manuell über die Supabase-UI ein.
- **Sicherheits-Vorbehalt (offen):** `/pg/query` ist aktuell öffentlich erreichbar und nimmt den
  Service-Role-Key als Voll-SQL-Zugang über HTTP (DB-Generalschlüssel). Solange `/pg/` nicht hinter
  VPN/intern liegt (Max prüft, s. Backlog), den Service-Role-Key strikt geheim halten (nur server-/
  skriptseitig) und den Endpoint nicht breiter nutzen als nötig.

### Code-Qualität
- `npm run build` nach JEDEM Feature – Fehler sofort fixen
- `git commit` nach jedem funktionierenden Feature
- **Git selbstständig: `add` / `commit` / `push origin main` ohne Rückfrage** ausführen — die
  Erlaubnis ist projektweit in `.claude/settings.local.json` erteilt (allow für git add/commit/
  push). Gilt auch für Reports/Specs/Doku: nach dem Schreiben direkt committen + pushen.
  **Ausnahme:** `git push --force`/`-f` und `git reset --hard` fragen weiterhin nach (in settings
  als `ask` gesetzt) — diese nur nach ausdrücklicher Freigabe.
- `str_replace` statt ganze Dateien neu schreiben
- Sequenziell arbeiten – ein Feature nach dem anderen
- Keine parallelen Baustellen

### Bash: keine `cd && Umleitung`-Kombination (sonst Permission-Stop)
Die Sperre „Compound command contains cd with output redirection — manual approval required"
wird durch die **Kombination** aus `cd` und Ausgabe-Umleitung in EINEM Befehl ausgelöst. Vermeiden:
- **Nie:** `cd /pfad && befehl > datei` · `cd /pfad && cat > datei << 'EOF'` · `cd /pfad && echo .. >> datei`
- **Stattdessen** Pfad direkt in die Umleitung schreiben, ohne `cd`-Vorspann:
  `befehl > /pfad/datei` · `cat > /pfad/datei << 'EOF'` · `echo .. >> /pfad/datei`
- Dateien bevorzugt über die **Datei-Tools (Write/Edit)** erstellen/ändern, nicht über Bash-`>`/`tee`.
- Reine Lese-/Prüf-Verkettungen (`ls; grep; echo`) sind ok — nur eben **ohne** `cd &&` davor
  (absolute Pfade in den Befehlen verwenden).

### UI/UX
- Mobile-first: Tailwind `sm:` `md:` `lg:` von Anfang an
- Jede Desktop-Tabelle braucht eine Mobile-Alternative (Karten-Liste)
- Shadcn/UI Komponenten immer wiederverwenden, nie neu generieren
- Formulare: immer `react-hook-form` + `zod`
- Loading States und Error States immer implementieren

---

## Verzeichnisstruktur

```
/workspace/wimus-erp/
├── app/
│   ├── (auth)/              # Login, MFA
│   ├── (dashboard)/         # Geschützte Routen
│   │   ├── layout.tsx       # Sidebar + Header
│   │   ├── page.tsx         # Dashboard
│   │   ├── objekte/         # Objektverwaltung
│   │   ├── einheiten/       # Einheitenverwaltung
│   │   ├── kontakte/        # Mieter/Eigentümer/DL
│   │   ├── vertraege/       # Vertragsmanagement
│   │   ├── buchungen/       # KZV-Buchungen
│   │   ├── vorgaenge/       # Vorgangsmanagement
│   │   ├── finanzen/        # OP, Mahnwesen, FIBU
│   │   ├── dokumente/       # DMS (Paperless API)
│   │   ├── pipelines/       # Akquise-Pipelines
│   │   ├── projekte/        # Bauprojekte (OpenProject)
│   │   ├── personal/        # HR (Kimai + Urlaub)
│   │   └── berichte/        # Reporting + Bank
│   └── api/
│       ├── objekte/route.ts
│       ├── einheiten/route.ts
│       ├── vertraege/route.ts
│       ├── buchungen/route.ts
│       ├── webhooks/
│       │   ├── beds24/route.ts
│       │   ├── paperless/route.ts
│       │   └── docuseal/route.ts
│       └── integrations/
│           ├── paperless/route.ts
│           ├── invoice-ninja/route.ts
│           └── docuseal/route.ts
├── components/
│   ├── ui/                  # Shadcn (nicht anfassen)
│   ├── layout/              # Sidebar, Header, Breadcrumbs
│   ├── objekte/             # Objekt-spezifische Komponenten
│   ├── vertraege/           # Vertrags-Komponenten
│   ├── finanzen/            # Finanz-Komponenten
│   └── shared/              # Wiederverwendbare Komponenten
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser Client
│   │   ├── server.ts        # Server Client
│   │   └── admin.ts         # Service Role (NUR server-side!)
│   ├── integrations/
│   │   ├── paperless.ts
│   │   ├── invoice-ninja.ts
│   │   ├── docuseal.ts
│   │   ├── beds24.ts
│   │   ├── nuki.ts
│   │   └── tuya.ts
│   └── utils/
│       ├── verwendungszweck.ts  # BHS16W3Z1 Parser
│       ├── kdu.ts              # KdU-Grenzwert-Check
│       ├── mietrecht.ts        # §558, §559 Logik
│       └── steuerfristen.ts    # 15%, 10J, §6b Tracking
├── types/
│   ├── database.ts          # Supabase generierte Typen
│   └── integrations.ts      # API-Typen externe Dienste
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── CLAUDE.md                # Diese Datei
```

---

## UI-Konventionen (Design System – nie abweichen)

Design System: `.docs/20260623_WIMUS_IT_ERP_40_DesignSystem_Docs_V100.docx`
Tokens: Tailwind v4 CSS-first in `app/globals.css` (`@theme`) – Quelle der
Wahrheit, nie direkt Farben/Größen hardcoden. **Kein `tailwind.config.ts`**
(v4 bleibt CSS-first), `tw-animate-css` statt `tailwindcss-animate`.

WIMUS-Markenfarben (ergänzen die Shadcn-Graustufen, ersetzen sie nicht):
`primary #1F4E5F · secondary #2E75B6 · teal #0D7680 · success #2E7D32 ·
danger #C62828 · warning #F59E0B` (+ `*-foreground`).

PFLICHT vor jedem Commit einer neuen Komponente:
1. Nur Token-Farben (primary/secondary/teal/success/danger/warning/muted)
2. Nur Inter als Font, nur definierte Größen (xs/sm/base/lg/xl/2xl/3xl)
3. 4px Grid – kein p-5, p-7, p-9, p-11
4. Labels IMMER über dem Input (nie Placeholder als Ersatz)
5. Fehlertext IMMER unter dem Input (nie als Banner oben)
6. Pflichtfeld * im Label (text-danger), HTML required ZUSÄTZLICH
7. Adresse IMMER getrennt: strasse / hausnummer / plz / stadt / land
8. Anrede: nur Herr / Frau / Firma / Keine
9. Detailansicht: AktenzeichenBadge + DmsButton oben rechts
10. Mobile 390px: prüfen ob Formular nutzbar

Shadcn-Komponenten IMMER verwenden:
Button, Input, Select, Dialog, Tabs, Table, Badge, Card, Sheet, Skeleton

WIMUS Custom-Komponenten (`components/ui/`):
AktenzeichenBadge, DmsButton, StatusBadge, PriorityBadge,
KpiCard, AddressBlock, KiVorschlag, MobileCard, ZaehlerstandInput

Konformität prüfbar via grep (Design System Kap. 8) + Playwright Mobile-Viewport.

---

## Konventionen

### Dateinamen
```
Seiten:      app/(dashboard)/objekte/page.tsx
API-Routen:  app/api/objekte/route.ts
Komponenten: components/objekte/ObjektKarte.tsx
Hooks:       hooks/useObjekte.ts
Utils:       lib/utils/verwendungszweck.ts
Typen:       types/database.ts
```

### API-Routen Pattern
```typescript
// app/api/objekte/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('objekte')
    .select('*, einheiten(*)')
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  // Validierung mit zod hier
  const { data, error } = await supabase
    .from('objekte')
    .insert(body)
    .select()
    .single()
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

### Formular-Pattern (react-hook-form + zod)
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  bezeichnung: z.string().min(1, 'Pflichtfeld'),
  adresse: z.string().min(1, 'Pflichtfeld'),
  // ...
})

type FormData = z.infer<typeof schema>

export function ObjektForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  // ...
}
```

### Listen-Pattern (Desktop + Mobile)
```typescript
// Desktop: Shadcn Table
// Mobile: Karten-Liste
// Beide aus EINEM Datensatz, responsive via Tailwind

<div className="hidden md:block">
  <DataTable columns={columns} data={data} />
</div>
<div className="md:hidden space-y-2">
  {data.map(item => <ObjektKarte key={item.id} objekt={item} />)}
</div>
```

---

## Verwendungszweck-Schema

Format: `{OBJEKTKÜRZEL}W{WOHNUNG}Z{ZIMMER}`

Beispiele:
- `BHS16W3Z1` = Bauhofstraße 16, Wohnung 3, Zimmer 1
- `AS125W2Z2` = Austraße 125, Wohnung 2, Zimmer 2
- `BS21A` = Bietigheimer Str. 21A (EFH, keine Unterteilung)

Parser in `lib/utils/verwendungszweck.ts`:
```typescript
export function parseVerwendungszweck(vz: string) {
  const match = vz.match(/^([A-Z0-9]+)(?:W(\d+))?(?:Z(\d+))?$/)
  if (!match) return null
  return {
    objektKuerzel: match[1],
    wohnung: match[2] ? parseInt(match[2]) : null,
    zimmer: match[3] ? parseInt(match[3]) : null,
  }
}
```

> **Bank-Abgleich nutzt diesen Parser** (nicht neu bauen): Das Objektkürzel = K1
> (IS17/ThS97/AS125…, s. Bestandsobjekte). Beim CSV-Abgleich wird der Verwendungszweck damit
> auf objekt/einheit aufgelöst; reicht der VZ nicht, übernimmt der Mieter-Namens-Match
> (`lib/fibu/lieferant-match.ts`).

---

## Mandanten (Multi-Brand)

Jede Marke ist ein eigener Mandant mit eigenen:
- E-Mail-Postfächern, Rufnummern, Briefköpfen
- Bank-IBANs, DATEV-Mandantennummern
- Vertragsvorlagen, Rechnungsvorlagen

**Aktive Mandanten:**
```
WIMUS Hausverwaltung  → LZV, WEG, Gewerbe
ALFA CAMPUS           → WG, Zimmer, Studenten
ALFA APARTMENTS       → KZV Bestand + R2R
ALFA DEVELOPMENT      → Ankauf, Entwicklung
```

**Mandant-Context in Next.js:**
```typescript
// Aktiver Mandant kommt aus Session/Cookie
// NIEMALS hardcoden
const { mandant } = useMandant() // Custom Hook
```

---

## Bestandsobjekte (Seed-Daten)

| Kürzel | Adresse | Typ | Status |
|--------|---------|-----|--------|
| IS17 | Ihmlingstr. 17, S-Bad Cannstatt | EW | IST |
| LS17 | Ihmlingstr. 17, Stuttgart | EW | IST |
| AS125 | Austraße 125, S-Münster | MFH 4WE+2G | IST |
| BHS16 | Bauhofstr. 16, Ludwigsburg | MFH 4WE 14Z | IST |
| MS13 | Murrstr. 13, Kornwestheim | MFH 3WE+GA | IST |
| SG10 | Spreuergasse 10, S-Bad Cannstatt | MFH 3WE | IST |
| BS21A | Bietigheimer Str. 21A, S-Zuffenhausen | EFH | IST |
| BS18A1 | Beilsteiner Str. 18A, Stuttgart | R2R KZV | IST |
| BS5A2 | Beilsteiner Str. 5A2, Kornwestheim | R2R KZV | IST |

---

## Kritische Steuerfristen (Tracking-Pflicht)

```typescript
// lib/utils/steuerfristen.ts

// 1. 15%-Grenze §6 Abs.1 Nr.1a EStG
// Start: nutzen_lasten_datum (NICHT notartermin!)
// Max. Renovierungskosten Jahre 1-3: 15% der AfA-Bemessungsgrundlage
// Bei Überschreitung: aktivierungspflichtig statt Sofortabzug

// 2. 10-Jahres-Frist §23 EStG (privat)
// Verkauf < 10J nach Kauf = steuerpflichtiger Spekulationsgewinn
// Frist ab: notartermin_datum

// 3. 3-Objekt-Grenze (privat)
// Max. 3 Verkäufe in 5 Jahren → sonst gewerblicher Grundstückshandel
// Rollierender 5-Jahres-Zähler

// 4. §6b EStG-Rücklage
// Reinvestitionsfrist: 4 Jahre (6J bei begonnenem Neubau)
// Verzinsung 6% p.a. bei Nichtreinvestition
```

---

## KZV-Vollautomatisierung (Zielbild)

```
Beds24 Webhook
  → n8n
    → Buchung in Supabase anlegen
    → Nuki/TTLock Code generieren (Check-in bis Check-out)
    → Tuya Heizung vortemperieren (2h vor Check-in)
    → WhatsApp Bestätigung an Gast (Code + Hausregeln)
    → Reinigungsauftrag nach Check-out planen
    → Rechnung via Invoice Ninja (7% USt)
    → Paperless (Rechnung archivieren)
```

---

## Wichtige gesetzliche Grenzen

```
§558 BGB Mieterhöhung:
- BW Kappungsgrenze: 15% in 3 Jahren (NICHT 20%!)
- Mindestabstand: 15 Monate seit letzter Erhöhung
- Begründung: Mietspiegel Stuttgart/Ludwigsburg

§559 BGB Modernisierungsumlage:
- 8% p.a. der Modernisierungskosten
- Kappung: max. 3€/m²/Monat in 6 Jahren

AG-Streitwertgrenze (ab 01.01.2026):
- Bis 10.000€: kein Anwaltszwang → KI kann vorbereiten
- Räumungsklage: immer AG, kein Streitwertlimit

CityTax:
- Stuttgart: 3€/Person/Nacht
- Ludwigsburg: 2€/Person/Nacht
- Quartalsexport an Gemeinde
```

---

## Entwicklungsplan (Phasen)

```
Phase 0  Fundament          CLAUDE.md + Schema + Auth + Mandanten          ✅ DONE
Phase 1  Core Immobilien    Objekte + Einheiten + Kontakte + Verträge      ✅ DONE
                            (bidirektionale Beziehungen + Detail-Listen)
Phase 2  Finanzen/Komm.     Mahnwesen 5-stufig + Kautionen (nativ) ✅      🟡 TEILWEISE
                            extern offen: OP/finAPI/CAMT, Invoice Ninja, Zammad
Phase 3  KZV Auto.          Buchungen-CRUD + Beds24-Webhook (nativ) ✅      🟡 TEILWEISE
                            extern offen (n8n): TTLock/Nuki, Tuya, WhatsApp, Rechnung
Phase 4  Vorgänge/Projekte  Vorgänge P14 + Plantafel P15 + Asset-Register ✅  🟡 TEILWEISE
                            extern offen: OpenProject; Wartungsfristen (Tabelle nur in wimus)
Phase 5  DMS & Dokumente    Paperless-Client + Dokumente-Seite + DocuSeal-Stub ✅  🟡 TEILWEISE
                            extern offen: Paperless-/DocuSeal-/Caya-Instanz + Token, PWA-Übergabe
Phase 6  KI-Agenten         13 Agenten via n8n + Claude API
Phase 7  Reporting/Bank     Dashboard + Selbstauskunft + Bank-PDF
Phase 8  Akquise/Pipelines  4 Pipelines + DCF-Kalkulator + Grundriss-KI
Phase 9  HR                 Kimai + Urlaubsverwaltung + ABS-RZ
Phase 10 Portale            Mieter + Eigentümer + KZV Self-Check-in
Phase 11 Steuer/Compliance  AfA + §6b + DSGVO + GoBD
Phase 12 Telefon KI         Retell AI
```

---

## Tabu-Liste (absolut)

```
❌ DMS/OCR selbst bauen          → Paperless-ngx API
❌ Unterschriften selbst bauen   → DocuSeal API  
❌ Rechnungen selbst bauen       → Invoice Ninja API
❌ Ticketing selbst bauen        → Zammad API
❌ Lohnabrechnung selbst bauen   → ABS-RZ
❌ Gantt selbst bauen            → OpenProject API
❌ Zeiterfassung selbst bauen    → Kimai API
❌ Service-Role-Key im Frontend  → nur app/api/
❌ Tabelle ohne RLS anlegen      → immer RLS aktivieren
❌ Tabelle ohne mandant_id       → immer mandant_id
❌ Ganze Datei neu schreiben     → str_replace nutzen
❌ Parallel mehrere Features     → sequenziell arbeiten
❌ Build-Fehler ignorieren       → sofort fixen
❌ Commit überspringen           → nach jedem Feature
```

---

## Aktueller Stand & nächste Schritte

**Erledigt (nativer Teil):**
- Phase 0 Fundament · Phase 1 Core Immobilien (Objekte/Einheiten/Kontakte/Verträge inkl.
  bidirektionaler Zuordnung + Detail-Listen, V01–V04 gem. Spec)
- Phase 2: Mahnwesen 5-stufig + Kautionen + Finanzen-Übersicht
- Phase 3: Buchungen-CRUD (jetzt `wimus.buchungen` nach Cutover), Verwendungszweck-Parser + CityTax-Helfer,
  zwei PINs (keybox statisch ≠ apartment dynamisch), Beds24-Webhook-Skeleton (timing-safe Secret + Upsert)
- Phase 4: Vorgänge (P14) + Plantafel (P15, Kanban) + Asset-Register/Inventar
- Phase 5: Paperless-ngx-Client (`lib/integrations/paperless.ts`) + `/dokumente` + DocuSeal-Stub

**App läuft auf `wimus`** (Cutover erfolgt, Stand 2026-06-28): `lib/supabase/server.ts` Default
`db.schema=wimus`, Seiten/APIs chainen `.schema("wimus")`. Das frühere `public`-CRUD (Migration 001)
ist abgelöst.
Migration 003 (KZV-Felder) ist eingespielt.

**Extern offen** (Schaltzentrale-Prinzip, nicht nachbauen – via n8n/API + Credentials):
- Phase 2: OP/finAPI/CAMT.053, Invoice Ninja (Rechnungen/DATEV), Zammad (Unified Inbox), Kommunikationskanäle
- Phase 3: TTLock/Nuki (Apartment-PIN), Tuya (Heizung), WhatsApp (GreenAPI), Rechnung
- Phase 4: OpenProject; Wartungsfristen (Tabelle nur im wimus-Schema)
- Phase 5: Paperless-/DocuSeal-/Caya-Instanz + Token setzen (PAPERLESS_URL/PAPERLESS_TOKEN); PWA-Übergabe

**Nächste sinnvolle Phase:** Phase 6 (KI-Agenten via n8n + Claude API), Phase 7 (Reporting/Bank),
(Cutover public→wimus bereits erfolgt).

