---
gehoert_zu: 0001
dokument: Architektur
geaendert: 2026-06-24
quelle: 20260624_WIMUS_IT_ERP_20_Architektur_Docs_V501.docx
---

# 0001 — Architektur

> Version & Status des Moduls stehen in `00_konzept.md`.

## 1. Technischer Stack

| Schicht | Technologie | Status |
|---------|-------------|--------|
| Frontend | Next.js 16, TypeScript, Tailwind v4 CSS-first, Shadcn/UI | ✅ erp.m81s.de |
| Datenbank | Supabase self-hosted (PostgreSQL + RLS) | ✅ supa.m81s.de |
| Dev | Claude Code, Node 22, GitHub maximusdigital/wimus-erp | ✅ Aktiv |
| Automatisierung | n8n self-hosted | ✅ Produktiv |
| Projektmanagement | Plane self-hosted | ✅ plane.m80s.de |
| CRM | amoCRM | ✅ Produktiv |
| PMS/Channel | Beds24 + Pricelabs | ✅ Webhook aktiv |
| Deployment | Coolify self-hosted | ✅ Produktiv |

## 2. Entwicklungsplan — 12 Phasen

| Phase | Inhalt | Status |
|-------|--------|--------|
| 0 – Fundament | CLAUDE.md, DB-Schema, Auth+MFA, Mandanten, RLS, Seed | ✅ DONE |
| 1 – Core Immobilien | Objekte, Einheiten, Kontakte, Verträge, Dashboard | ✅ DONE |
| 2 – Finanzen & Komm. | OP-Management, CAMT, Mahnwesen, Invoice Ninja, Zammad | ▶ AKTIV |
| 3 – KZV Vollautom. | Beds24, TTLock, Tuya, WhatsApp, Rechnung → MVP LIVE | Offen |
| 4 – Vorgänge & Projekte | Vorgangsmanagement, Plantafel, Asset-Register | Offen |
| 5 – DMS & Dokumente | Paperless-ngx, Caya, DocuSeal, Digitale Übergabe PWA | Offen |
| 6 – KI-Agenten | 13 Agenten + Akteur-Modell + Channel-Routing | Offen |
| 7 – Reporting & Bank | Portfolio-Dashboard, Bank-PDF, DATEV, GoBD, Print A4 | Offen |
| 8 – Akquise & Pipelines | Pipelines, DCF, Grundriss-KI, Funnels, Landingpages | Offen |
| 9 – HR & Zeiterfassung | Kimai, Urlaubsverwaltung, ABS-RZ, Fahrtenbuch | Offen |
| 10 – Portale | Mieter, Eigentümer, Gäste Self-Check-in, Werkstudent UI | Offen |
| 11 – Steuer & Compliance | AfA, KPA/RND, DSGVO-Löschkonzept, §6b | Offen |
| 12 – Telefon KI | Retell AI je Marke DE/EN/RU, 24/7 | Offen |

> Bezug FiBu (0002): überlappt mit Phase 5 (OCR/DMS), Phase 7 (Reporting/Bank/DATEV)
> und Agent 11 (FIBU/Mieteingang). FiBu-Modul detailliert und erweitert diese Bausteine.

## 3. Channel-Routing

### 3.1 Eingehende Nachricht — Routing-Flow

1. Lock prüfen (`konversation_locks`): KI-Lock → KI antwortet; MA-Lock → Zammad; sonst weiter.
2. `channel_routing` laden — ORDER BY prioritaet, zeitfenster, wochentag.
3. Kollisionsstrategie: `erst_ki_dann_mensch` → Lock auf ki_agent; Mensch übernimmt → Lock
   auf ma; KI stoppt sofort → keine Doppelantworten.
4. Eskalation: KI-Konfidenz < 0.70 → Lock freigeben → Zammad Prio hoch → Telegram an
   Abteilung → nach X Min ohne Antwort → nächste Ebene.

### 3.2 Ausgehende Nachricht — Pipeline-Flow

Phasenwechsel (Deal) → `pipeline_phase_aktionen` laden (trigger_typ bei_eintritt /
nach_x_tagen) → `aktion_channels` laden (0..n) → n8n `Promise.all([...])` PARALLEL je
Channel → Erfolg: nachrichten-Log gesendet / Fehler: Fallback-Channel + Log
fallback_aktiviert. View `v_faellige_phase_aktionen` täglich 06:00 (faellig_am <= NOW
AND bereits_ausgefuehrt = FALSE).

## 4. 27 Module via API (TB01–TB27)

| TB# | Modul | Tool | Status |
|-----|-------|------|--------|
| TB01 | Multi-Projekt | Supabase RLS + projekt_id | Im Schema |
| TB02 | E-Mail | Je Projekt eigenes Postfach | Zu konfigurieren |
| TB03 | SMS | seven.io | Zu integrieren |
| TB04 | WhatsApp | GreenAPI (je Projekt eigene Instanz) | Zu integrieren |
| TB05 | Automatisierung | n8n self-hosted | ✅ Produktiv |
| TB06 | KZV PMS | Beds24 + Pricelabs | ✅ Aktiv |
| TB07 | Zugänge | TTLock G5-Gateway | Hardware bestellt |
| TB08 | Bankanbindung | finAPI / CAMT.053 | Zu integrieren |
| TB09 | Telefon | sipgate | Zu konfigurieren |
| TB10 | KI-Telefon | Retell AI | Phase 12 |
| TB11 | KI-Layer | Claude API (Anthropic) | Zu integrieren |
| TB12 | Smart Home | Tuya Cloud API | Zu integrieren |
| TB13 | Dateispeicher | Nextcloud WebDAV/CalDAV | ✅ Vorhanden |
| TB14 | DMS/OCR | Paperless-ngx | Coolify One-Click |
| TB15 | Unterschriften | DocuSeal | Coolify One-Click |
| TB16 | Rechnungen | Invoice Ninja SKR03 | Coolify One-Click |
| TB17 | Ticketing | Zammad (iFrame/SSO) | Coolify One-Click |
| TB18 | Digitale Übergabe | Eigene PWA (offline) | Zu bauen |
| TB19 | Post | Caya | SaaS |
| TB20 | Lohnabrechnung | ABS-RZ absPortal | ✅ Im Einsatz |
| TB21 | Zeiterfassung | Kimai (Coolify) | Docker |
| TB22 | Urlaub | urlaubsverwaltung.cloud | Docker |
| TB23 | Bauprojekte | OpenProject Community | Docker |
| TB24 | CRM | amoCRM | ✅ Produktiv |
| TB25 | Marktwert | Sprengnetter/Pricehubble | Manuell MVP |
| TB26 | KI-OCR | Mistral OCR Batch ($1/1000 Seiten) | API |
| TB27 | KI-Vision | Gemini Flash + Claude Sonnet Vision | API |

## 5. KI-Tier-Modell

| Tier | Modell | Einsatz | Kosten |
|------|--------|---------|--------|
| 1 – Lokal | Ollama | Klassifizierung, Routing, DSGVO-kritisch | ~0 EUR |
| 2 – EU | Mistral Small/Large | Posteingang, einfache Antworten | Günstig |
| 3 – Komplex | Claude API | Recht, Verträge, komplexes Reasoning | Mittel |
| 4 – OCR | Mistral OCR Batch | Alle eingehenden Dokumente | $1/1.000 Seiten |
| 5 – Vision Vorprüfung | Gemini Flash | Bild-Qualitätsprüfung | $0,0005/Bild |
| 6 – Vision Abgleich | Claude Sonnet Vision | KI-Bildabgleich Checklisten | $0,004/Bild |
| 7 – Transkription | Whisper self-hosted | Anrufe, WhatsApp-Sprachnachrichten | ~0 EUR |
| 8 – Telefon | Retell AI | KI-Agent DE/EN/RU | 0,05–0,10 EUR/Min |
| 9 – SEO | Claude API + SuperSEO Skills | Page-Audit, Content-Brief, Gap | API-Kosten |

## 6. 13 KI-Agenten

| # | Agent | Trigger | Kernaufgabe |
|---|-------|---------|-------------|
| 1 | Posteingang | Neue Nachricht alle Kanäle | Klassifizieren, zuordnen, Antwortvorschlag |
| 2 | Buchungs-Agent KZV | Beds24-Webhook | Buchung, TTLock, Tuya, WhatsApp, Rechnung |
| 3 | Mahnwesen | Täglich / Fälligkeit | Mahnstufe, Dokument, Mahnbescheid |
| 4 | Dokument | Neues Dok Paperless/Caya | Typ, Metadaten, ablegen, Rechnungen scannen |
| 5 | Vorgänge | Neue Schadensmeldung | Priorität, Handwerker, Auftrag, Preisspiegel |
| 6 | Bewerber | Neue Mietbewerbung | Einkommen-OCR, KdU-Check, Scoring |
| 7 | Wartung | Täglich / Kalender | Fristen (Rauchmelder/TÜV), Vorgang anlegen |
| 8 | Reporting | Monatlich/Quartal | Eigentümer-Report, Bank-Präsentation, GoBD |
| 9 | Revenue | Täglich 06:00 | Pricelabs, §558-Potenzial, Event-Radar |
| 10 | Rechts (Recht Mike) | Event-basiert + täglich | Fristenüberwachung, Klageschrift AG |
| 11 | FIBU/Mieteingang | Täglich nach Bankimport | finAPI/CAMT, OP-Abgleich |
| 12 | Grundriss | Neues Objekt / Exposé | Claude Vision, Zimmer-Splitting, ROI |
| 13 | SEO-Agent | Wöchentlich | SuperSEO Skills + GSC MCP, page-audit, gap-analyse |

> Bezug FiBu (0002): Agenten 4 (Dokument), 8 (Reporting), 11 (FIBU/Mieteingang) sind die
> Akteure des FiBu-Moduls. Das FiBu-Modul detailliert deren Belegerkennungs-, Kontierungs-
> und Reporting-Aufgaben.
