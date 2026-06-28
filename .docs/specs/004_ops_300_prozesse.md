---
gehoert_zu: 0004
dokument: Prozesse
geaendert: 2026-06-28
---

# 0004 — Prozesse

> Version & Status stehen in `004_ops_000_konzept.md`.

## 1. Vorgang-Lebenszyklus (Engine, jeder Typ)

1. **Anlegen** — manuell, aus Portal-Schadensmeldung (Foto→Vorgang), aus Frist (Wartung), aus
   KZV-Check-out (Reinigung). Auto-Aktenzeichen via Trigger. Status `offen`.
2. **Zuweisen** — intern (Akteur) oder extern (Organisation/Handwerker); Status `zugewiesen`;
   bei extern: Auftrag-Versand (Hook). Verlauf-Eintrag.
3. **Bearbeiten** — Status `in_arbeit`; ggf. `wartet_extern` (Angebot/Teil). Pflicht-/Checklisten
   je Typ. Foto Vorher/Nachher.
4. **Abschluss** — `erledigt`; bei abnahmepflichtigen Typen `abgenommen`. Kostenträger →
   Forderung/Beleg. Oder `abgebrochen` (+ Grund im Verlauf).
5. **Benachrichtigung** bei jedem Statuswechsel an Melder/Mieter/Dienstleister (Hook).
6. **Eskalation** bei `prioritaet=notfall` oder Überfälligkeit → `eskaliert`, Verlauf, Hinweis
   an Verantwortlichen (Hook).

## 2. Typ-Prozesse (dünne Erweiterung auf der Engine)

- **Reinigung (KZV-Turnaround):** Check-out (Beds24→n8n) → Reinigungs-Vorgang mit `buchung_id`;
  Checkliste je Raum, Foto Vorher/Nachher, Inventarcheck; Schaden gefunden → Folge-Vorgang
  `typ=schaden`. `naechster_checkin` steuert Dringlichkeit.
- **Übergabe (LZV einzug/auszug):** Checkliste je Raum, **Zählerstände aus Foto** (Claude Vision,
  `modus=zaehler` → strukturierte Stände an `vorgang_foto.ki_analyse`, gespiegelt in
  `vorgang_uebergabe.zaehlerstaende.ki`), Schlüssel, Signatur (Paperless-Hook). Auszug vergleicht
  mit Einzug (`abgleich_vorgang_id`) → **Foto-Abgleich Vorher/Nachher** (Claude Vision,
  `modus=abgleich` → Schadensvorschläge) → Schadensliste → Kautionsabrechnung (Kern).
- **Wartung:** aus Frist erzeugt; Prüfprotokoll (Paperless); nach Abschluss neue Frist /
  `naechste_faelligkeit`. Dienstleister-Beauftragung über Zuweisung.
- **Reparatur:** Angebot/Preisspiegel (`angebot_betrag`), `wartet_extern`; Abnahme
  (`abgenommen`); Gewährleistung (`gewaehrleistung_bis`, §634a).
- **Schaden:** Kategorie/Schwere; **gestaffelte Abwicklung** (`abwicklungsstufe`): bagatell→
  Kaution/Pauschale · mittel→Plattform · gross→manuell+Versicherung · grossschaden→Mahnbescheid/
  Anwalt. Verknüpfung Forderung + ggf. Versicherung; Incident-PDF (Hook).

## 3. Zuweisung & Eskalation

- Vorschlag (manuell/KI), Beauftragung, Annahme/Ablehnung, Erledigung — alles als
  `vorgang_zuweisung`-Status + Verlauf. Auto-Zuweisung (Skill/Verfügbarkeit/Rolle) später.
- Eskalation: Notfall sofort, Überfälligkeit nach Frist; an Verantwortlichen/Vertretung.

## 4. Sichten

- **Plantafel** (Kanban nach Status, Drag&Drop → Statuswechsel + Verlauf).
- **Liste/Filter** je Typ („Reinigung heute", „meine Aufträge" = Filter auf Akteur/Typ/Status).
- **Detail** mit Verlauf-Timeline, Zuweisungen, Fotos, Typ-Zusatz, Checkliste.

## 5. KI-Bildanalyse (Übergabe-Fotos, Claude Vision)

- **Zählerstand:** Foto je Zähler → `POST /api/vorgaenge/[id]/foto-analyse {modus:"zaehler",fotoId}`
  → Claude liest `{zaehler:[{art,zaehlernummer,stand,einheit}],confidence}` → validiert →
  `vorgang_foto.ki_*`. Kritisch (Abrechnung) → **nie auto**, immer mind. prüfen.
- **Vorher/Nachher-Abgleich:** `{modus:"abgleich"}` über alle Vorher- + Nachher-Fotos → Claude
  liefert `{schaeden:[{ort,beschreibung,schaden_typ,schwere,neu}],confidence}` → Ergebnis am
  jüngsten Nachher-Foto. Vorschläge sind **Entwurf**.
- **Schaden-Übernahme:** Mensch bestätigt je Vorschlag („Als Schaden anlegen",
  `POST /api/vorgaenge/[id]/schaden-uebernehmen` mit `{fotoId,index}`) → **Folge-Vorgang
  `typ=schaden`** (eigener Vorgang, da Übergabe schon Typ `uebergabe` ist) + `vorgang_schaden`
  (Typ/Schwere, Priorität aus Schwere), Beschreibung im Verlauf. Objekt/Einheit vom Übergabe-
  Vorgang geerbt; Verlauf-Querverweis in beiden Vorgängen.
  - **Kostenträger automatisch aus Richtung** (Override via `kostentraeger` möglich):
    Auszug → `mieter` (Verschulden → Kaution), Einzug → `vermieter` (Bestandsschaden).
  - **Idempotent:** der Vorschlag wird in `vorgang_foto.ki_analyse.schaeden[index]` mit
    `uebernommen:true` + `folge_vorgang_id` markiert; erneute Übernahme wird geblockt (409),
    UI zeigt nach Reload „angelegt" statt Button (Dubletten-Block wie im Kern).
- **Routing** (`lib/ops/confidence.ts`): ≥0.90 auto · 0.75–0.89 pruefen · <0.75 manuell.
- Mistral OCR bleibt FiBu/Belege-only (keine Vermischung).

## 6. Querbezug Kern

- Fristen erzeugen Wartungsvorgänge; Forderungen/Kaution hängen an Schaden/Übergabe; Akteure
  sind Träger; DMS/Channel liefern Anhänge/Benachrichtigung. Vorgänge-Verknüpfung in anderen
  Modulen über `vorgang_id`.
