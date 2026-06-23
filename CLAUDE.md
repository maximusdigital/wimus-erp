@AGENTS.md
claud# WIMUS ERP – Claude Code Anweisungen

## Projekt-Kontext

WIMUS ERP ist die digitale Schaltzentrale für die Württembergische Immobilien Management und Service GmbH (WIMUS). Es verwaltet mehrere Marken (ALFA CAMPUS, ALFA APARTMENTS, ALFA DEVELOPMENT, WIMUS Hausverwaltung) und deren Objekte, Mieter, Verträge, KZV-Buchungen, Finanzen und Prozesse.

**Eigentümer:** Dipl.-Kfm. Maxim Moser  
**Portfolio:** 27 Einheiten, 6,9 Mio EUR Marktwert, 957 TEUR Jahresmiete  
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Shadcn/UI + Supabase (self-hosted)  
**Live:** erp.m81s.de | Supabase: supa.m81s.de | Repo: github.com/maximusdigital/wimus-erp



## Arbeitsweise
- Keine Rückfragen stellen. Bei Unklarheiten sinnvolle Standardannahme treffen,
  umsetzen und die Annahme kurz dokumentieren.    Dann gilt es für jede Session in diesem Projekt automatisch.

---

## Datenmodell-Stand (v5)

**Maßgebliche Spec:** `.docs/WIMUS_ERP_Uebergabedokument_v5.docx` (Version 5.0, Kap. 5). Bei mehreren Versionen immer die höchste lesen.

- **Schema `wimus`** (search_path = `wimus, public`), Plural, kein Prefix
- **Zieldatenmodell: 82 Tabellen** in 5 Gruppen (Kern · Verträge/Buchungen/Bank · Objekt-Details/Ausstattung/Zähler/Custom Fields · Steuer/AfA/Szenarien · Vorgänge/Workforce/Vertrieb)
- Migration `supabase/migrations/002_vollstaendiges_schema.sql` legt das `wimus`-Schema **additiv** an (das bestehende `public`-CRUD bleibt unberührt). Anwendung über Supabase SQL-Editor (DB-Port bleibt geschlossen).
- **Konventionen:** Adresse IMMER getrennt (`strasse, hausnummer, plz, stadt, stadtteil, land`) · Anrede `Herr/Frau/Firma/Keine` · `created_at`/`updated_at` auf allen Tabellen (Trigger) · `mandant_id` auf allen Kerntabellen · RLS `mandant_isolation` auf allen Tabellen · Aktenzeichen auto via DB-Trigger (`vorgaenge`) · 12 Seed-Rollen
- **5 polymorphe Referenzen** (`bezug_typ` + `bezug_id`): `versorgervertraege`, `zaehler`, `custom_field_werte`, `objekt_emails`, `geraete`
- **Versionierte Tabellen** (`gueltig_ab`): `einheit_hausregeln`, `einheit_sicherheit`, `gaestemappe_inhalte`
- **Zwei PIN-Codes je Buchung:** `keybox_pin` (statisch, Hauszugang aus `einheiten.keybox_pin_statisch`) ≠ `apartment_pin` (TTLock, dynamisch je Buchung)

**Neu seit Phase 1** (über die 4 CRUD-Entitäten hinaus): gaestemappe_inhalte, einheit_bettenstruktur, einheit_fotos, einheit_pois, einheit_sicherheit, stornierungsbedingungen, zertifikate_lizenzen, versorgervertraege, zaehler, zaehlerstaende, zaehler_umrechnungen, objekt_emails, custom_field_definitionen, custom_field_werte, intercompany, ma_profile, ma_verfuegbarkeit, objekt_zuweisungen, einsaetze, auftrag_zuweisungen, checklisten_vorlagen, checklisten_positionen, checklisten_ausfuehrungen, checklisten_ergebnisse, pipelines, pipeline_phasen, deals, vertriebspartner, maklervertraege, expose_varianten, interessenten, besichtigungen, provisionen, bewertungen, incident_reports, citytax_buchungen, nachrichten, vorlagen, filter_profile, geraete, wartungsintervalle, versicherungen.

> Hinweis: v5 deklariert 82 Tabellen; der Fließtext spezifiziert ~40 mit Spalten (Gruppensummen ergeben 77). Migration 002 implementiert alle namentlich genannten Tabellen (76) vollständig mit FK + RLS + Indizes. Die genaue 82-Enumeration wird ergänzt, sobald die vollständige Tabellenliste vorliegt. **App-Cutover public→wimus ist ein separater, geplanter Schritt** – bis dahin läuft das CRUD weiter auf `public`.

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
| Zugänge | Nuki / TTLock | REST API |
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

### Code-Qualität
- `npm run build` nach JEDEM Feature – Fehler sofort fixen
- `git commit` nach jedem funktionierenden Feature
- `str_replace` statt ganze Dateien neu schreiben
- Sequenziell arbeiten – ein Feature nach dem anderen
- Keine parallelen Baustellen

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
Phase 0  Fundament          CLAUDE.md + Schema + Auth + Mandanten
Phase 1  Core Immobilien    Objekte + Einheiten + Kontakte + Verträge
Phase 2  Finanzen/Komm.     OP + Mahnwesen + Invoice Ninja + Zammad
Phase 3  KZV Auto.          Beds24 + Nuki + Tuya + WhatsApp-Flow
Phase 4  Vorgänge/Projekte  P14 Vorgänge + Plantafel + OpenProject
Phase 5  DMS & Dokumente    Paperless + Caya + DocuSeal + PWA Übergabe
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

## Nächster Schritt: Phase 0

1. Diese CLAUDE.md ist bereits erstellt ✅
2. Supabase Migration erstellen (`supabase/migrations/001_initial_schema.sql`)
3. Auth-Setup (Supabase Auth + MFA)
4. Mandanten-Context implementieren
5. Layout fertigstellen
6. Seed-Daten einspielen

