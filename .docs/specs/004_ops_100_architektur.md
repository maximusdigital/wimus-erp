---
gehoert_zu: 0004
dokument: Architektur
geaendert: 2026-06-28
---

# 0004 — Architektur

> Version & Status stehen in `004_ops_000_konzept.md`. Baut auf Kern 0001.

## Leitprinzip: eine Engine, Typen erben

Es gibt **keine** parallelen Subsysteme für Reinigung/Übergabe/Wartung. Es gibt die
**Vorgangs-Engine** (`vorgaenge` + Begleittabellen `vorgang_verlauf`/`_zuweisung`/`_foto`) und
fünf **Typ-Erweiterungen** (`vorgang_reinigung/_uebergabe/_wartung/_reparatur/_schaden`), die
1:1 am Vorgang hängen. Jede Engine-Fähigkeit ist genau einmal implementiert und wird von jedem
Typ genutzt. Sichten („Reinigung heute", „meine Aufträge", Plantafel) sind Filter/Views, kein
eigenes Datenmodell.

## Schichten

| Schicht | Inhalt | Quelle/Tabellen |
|---------|--------|-----------------|
| Engine-Kern | Vorgang anlegen/bearbeiten, Status-Flow, Aktenzeichen, Kostenträger | `vorgaenge` |
| Verlauf | Audit-Timeline jeder Änderung/Statuswechsel | `vorgang_verlauf` |
| Zuweisung | intern (Akteur) + extern (Organisation/Handwerker), Auftrag-Versand | `vorgang_zuweisung`, `akteure` |
| Foto | Vorher/Nachher + Pflichtfotos (Referenzen) | `vorgang_foto` |
| Checklisten | Vorlagen/Positionen + Ausführung je Vorgang | `checklisten_*` (Kern 002) |
| Typ-Zusatz | je Typ ein 1:1-Datensatz + UI-Sicht | `vorgang_<typ>` |

## Systemgrenzen / externe Anbindung (Hook/Stub)

- **Benachrichtigung bei Statuswechsel** → Channel-System (E-Mail/WhatsApp/Telegram/Zammad):
  Engine schreibt `vorgang_verlauf` (art=benachrichtigung) + Feld `benachrichtigung_kanal`;
  echte Zustellung via n8n/Channel später.
- **Externer Auftrag-Versand** → `vorgang_zuweisung.auftrag_versendet_am`/`auftrag_kanal`
  (Stub); Versand via n8n später.
- **Foto-Capture/Storage** → Paperless/Nextcloud: Felder `paperless_id`/`url`, Upload später.
- **KI-Prüfung Checkliste** (`ki_schwellenwert`/`max_versuche`) → Hook; KI-Call später.
- **KZV-Turnaround** → Beds24-Webhook → n8n erzeugt Reinigungs-Vorgang (`vorgang_reinigung`
  mit `buchung_id`); der Webhook-Skeleton existiert im Kern.

## KI-Bildverarbeitung (gebaut 2026-06-28)

Bewusste Modelltrennung — **keine Vermischung**:

| Aufgabe | Modell | Anbindung | Output |
|---------|--------|-----------|--------|
| Belege/Rechnungen (FiBu 0002) | **Mistral OCR** | `lib/integrations/mistral.ts` | Markdown + JSON |
| Zählerstand-Foto (Übergabe) | **Claude Vision** (`claude-opus-4-8`) | `lib/integrations/claude.ts` | JSON nach Schema |
| Vorher/Nachher-Abgleich + Schadenskategorisierung | **Claude Vision** | `lib/integrations/claude.ts` | JSON nach Schema |

- Mistral bleibt **FiBu/Belege-only**; Claude macht die zwei Übergabe-Bildaufgaben. Schema im
  Prompt, **nur JSON** zurück, serverseitig gegen zod-Schema validiert (`lib/validations/foto-analyse.ts`).
- **Ablauf:** Foto liegt in Supabase Storage (`vorgang-fotos`) → Endpoint
  `/api/vorgaenge/[id]/foto-analyse` (`modus=zaehler|abgleich`) lädt Bytes per Public-URL, ruft
  Claude, validiert, **routet per Confidence** (`lib/ops/confidence.ts`) und schreibt
  `ki_analyse`/`ki_confidence`/`ki_status`/`ki_analysiert_am` an `vorgang_foto` (Migration 019).
- **Confidence-Routing** (wie OCR-Pipeline): ≥0.90 auto · 0.75–0.89 pruefen · <0.75 manuell.
  Kritische Felder (Zähler→Abrechnung, Schaden→Kaution) **nie auto** → mindestens pruefen.
- **Serverseitig** (App-Route, liest `ANTHROPIC_TOKEN`); Service-Role nur für Storage. Kein
  Vision-Modell im Client. Token (`ANTHROPIC_TOKEN`) noch zu setzen.

## Träger-Modell (akteure)

Jeder Vorgang hat einen `owner_akteur_id` (verantwortlich) und 0..n `vorgang_zuweisung`
(ausführend, intern Akteur / extern Organisation/Handwerker). Akteur = Mensch **oder** KI —
KI-Agenten (z.B. Posteingang/Schaden) sind ebenfalls Akteure und können Vorgänge tragen.

## Querbezug Kern (0001)

- **Fristen → Vorgang:** fällige Wartungsfrist (`fristen.frist_typ wartung_*`) erzeugt einen
  Vorgang `typ=wartung` (+ `vorgang_wartung.frist_id`).
- **Vorgang → Forderung:** Schaden mit Mieter-/Versicherungs-Kostenträger erzeugt/verknüpft
  eine Forderung (`forderungen.vorgang_id`); Abgleich mit Kaution.
- **Übergabe → Kaution:** Auszug-Vorgang vergleicht mit Einzug (`abgleich_vorgang_id`) →
  Schäden → Kautionsabrechnung (Kern).
- **Akteure/Organisationen/DMS/Channel** kommen aus dem Kern.
