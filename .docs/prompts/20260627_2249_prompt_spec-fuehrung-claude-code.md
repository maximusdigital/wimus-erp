# Auftrag: Claude Code führt ab sofort die Specs

Ab sofort bist **du (Claude Code) der alleinige Verwalter der Specs** unter `.docs/specs/`.
Grund: Du hast Zugriff auf Code, Live-Schema `wimus` und den Word-Bestand — der Chat-Claude
arbeitet aus Zusammenfassungen und erzeugt dadurch Missverständnisse (zuletzt beim ops-Modul).
Die Spec soll dort gepflegt werden, wo die Wahrheit liegt: bei dir, am Code.

## Rollenverteilung ab jetzt

- **Chat-Claude:** Sparringspartner für Konzept, Recherche, Diagramme, Entscheidungen.
  Schreibt KEINE Spec-Dateien mehr direkt.
- **Du (Claude Code):** führst die Specs. Jede Spec-Änderung machst nur DU, gegen den realen
  Code-/Schema-/Bestandsstand abgeglichen. Du sorgst für Konsistenz Spec ↔ Code.

## Verbindliche Regeln (Konvention)

Maßgeblich sind `README.md` und `_PROMPT_spec-sync.md` im specs-Ordner. Kurzfassung:

- **Flaches Schema:** `MMM_kuerzel_DDD_name.md` (z.B. `004_ops_200_datenmodell.md`).
  Module: 001 erp, 002 fibu, 003 crm, 004 ops. Doku-Nummern 000/100/200/300/400/500/600.
- **Stabile Dateinamen.** Querverweise immer als voller Dateiname.
- **Version lebt NUR in `*_000_konzept`.** Springt nur am Meilenstein; im Cycle wachsen nur
  Historie + `geaendert`.
- **Änderungshistorie** in jeder `*_000_konzept` — Pflicht: `| Datum/Zeit | Vorgang | Betroffen |`,
  neueste oben, Vorgang ≤ 100 Zeichen, mit Datum **und Uhrzeit**.
- **Decision-Log** ergänzen, nie löschen. Keine Modell-/Inhaltsänderung ohne Konzept-Nachtrag.
- **Nichts doppelt:** Module referenzieren Kern-Entitäten, halten keine eigenen Kopien.
- **Charts:** shadcn-charts (Recharts-basiert); Sankey = rohes Recharts.
- **SQL:** idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).
- **Kein Commit ohne grüne Tests** (`npm run test:run` + `npm run build`). Git-Sicherung vor
  jeder Änderung. Erst Abgleich-Bericht, dann auf Freigabe ändern — nichts blind überschreiben.

## Sofort-Aufgaben

1. **Spec-Hoheit übernehmen:** Lauf einmal den `_PROMPT_spec-sync.md` (Drei-Wege-Abgleich
   Spec ↔ Code ↔ Word-Bestand) über alle Module. Melde A/B/C/D-Funde, hol Freigabe, zieh nach.
2. **Modul 004 (ops) neu aufbauen** aus echten Quellen (Word-Bestand + Code + Live-Schema) —
   das vom Chat gelieferte `004_ops_*` ist Rekonstruktion, NICHT als Wahrheit nehmen, ersetzen.
   Architektur: EINE Vorgangs-Engine (voller Funktionsumfang: Bildabgleich, Status-
   Benachrichtigung, Zuweisung int/ext, Eskalation, Verlauf/Audit, Kostenträger, Checklisten),
   Typen (Reinigung/Übergabe/Wartung/Reparatur/Schaden) als dünne Erweiterungen + eigene Sicht.
   Vorgänge ziehen aus Kern (0001) → 004 um; im Kern nur Verweis + Verknüpfungspunkte. Beide
   Module mit Historie nachziehen.

## Neuentwicklung: Bildverarbeitung & strukturierter Output (Modul 004)

Eigener Spec-Abschnitt (Architektur + Prozesse in 004), als Entscheidung + Historie festhalten:

- **Anforderung:** strukturierter, schema-validierter Output am Ausgang (JSON in DB-Felder),
  NICHT Fließtext. Mit Confidence-Scoring wie OCR-Pipeline (≥0.90 auto / 0.75–0.89 markieren /
  <0.75 manuell). Kritische Felder (z.B. Zählerstand → Abrechnung) IMMER prüfen.
- **Modellzuordnung (bewusst, keine Vermischung):**
  | Aufgabe | Modell | Output |
  |---------|--------|--------|
  | Belege/Rechnungen (FiBu 0002) | Mistral OCR | Markdown + JSON |
  | Zählerstand-Foto (Übergabe) | Claude | JSON nach Schema |
  | Vorher/Nachher-Abgleich + Schadenskat. | Claude | JSON nach Schema |
- **Mistral bleibt FiBu-only** (Belege/Dokumente) — NICHT für Übergabe-Fotos.
- **Claude macht beide Übergabe-Bildaufgaben** (Zähler + Abgleich): Schema im Prompt vorgeben,
  nur JSON zurück (keine Fences/Vorspann), serverseitig gegen Schema validieren.
- **Kein zusätzliches Vision-Modell.** Volumen ~500 Bilder/Monat (20 Bilder × ~25 Übergaben)
  → Kosten <1 €/Monat, daher keine Volumen-Optimierung/Fallback nötig. Qualität vor Sparen.
- **Vorbehalt in Spec vermerken:** Modellgüte an 20–30 echten Vorher/Nachher-Paaren
  (reale Foto-Qualität) verifizieren, bevor Auto-Confidence-Schwellen scharf gestellt werden.

## Vorgehen
Erst Abgleich-Bericht + Plan, dann auf meine Freigabe Spec + Code schreiben + testen.
Historie/Decision-Log/Version bei JEDER Änderung mitführen.
