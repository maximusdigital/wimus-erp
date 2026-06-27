---
gehoert_zu: 0004
dokument: Prozesse
geaendert: 2026-06-27
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
- **Übergabe (LZV einzug/auszug):** Checkliste je Raum, Zählerstände (OCR-Hook), Schlüssel,
  Signatur (Paperless-Hook). Auszug vergleicht mit Einzug (`abgleich_vorgang_id`) →
  Schadensliste → Kautionsabrechnung (Kern).
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

## 5. Querbezug Kern

- Fristen erzeugen Wartungsvorgänge; Forderungen/Kaution hängen an Schaden/Übergabe; Akteure
  sind Träger; DMS/Channel liefern Anhänge/Benachrichtigung. Vorgänge-Verknüpfung in anderen
  Modulen über `vorgang_id`.
