# Antworten Claude Code — Bank-Abgleich + Kanban-Reports (2026-06-28 09:45 MESZ)

Beide Reports geprüft, sauber gebaut. K1-Auflösung + Fuzzy-Umstellung wie erhofft; papaparse-
Abweichung korrekt dokumentiert. 314 Tests grün. Antworten auf die Rückfragen:

## Bank-Abgleich (Report 0925)

1. **Vorfilter eigene Umbuchungen — Namen-Quelle:** BEIDES. Eigene Firmen-/Kontoinhaber-Namen
   automatisch aus `firmen` + `bank_konten` ziehen (Basis) PLUS pflegbare Ignorier-Liste je
   Mandant (Settings) für Sonderfälle (alte/Privat-Konten). Auto-Quelle + manuelle Ergänzung.

2. **Mehrere offene Miete-Forderungen — FIFO:** Ja, älteste zuerst (verjährungs-/mahnnah). Bei
   Überzahlung automatisch die nächste offene Forderung mitbedienen, verbleibender Rest →
   Guthaben. Kontokorrent-Verhalten.

3. **Confidence-Schwellen:** Zentral konfigurierbar machen (analog Beleg-Gating), mit deinen
   Defaults als Startwert (auto ≥0.90 / pruefen ≥0.75 / Name-Min 0.82). So justierbar ohne
   Code-Änderung beim späteren Schärfen.

4. **Echte WISO-Exporte zum Schärfen:** Ja — kommt von Max nach Einspielen von 021. Kein
   Bau-Schritt jetzt; nur vormerken.

**Blocker (Max):** Migration `021_bank_abgleich.sql` in Supabase SQL-Editor einspielen, sonst
wirft `/finanzen/bank` Fehler.

## Kanban (Report 0925)

1. **Drag-Smoke mit Seed-Daten:** Ja, bitte. 2–3 Wegwerf-Vorgänge/Deals seeden, Drag-Reorder
   prüfen (Karte verschieben + Reihenfolge), danach aufräumen. Schließt die letzte Lücke, bevor
   echte Daten da sind.

## Spec-Nachzug (macht Konzept-Claude, separat)
- 002_fibu: Bank-Abgleich von „Spec vorab" auf gebaute Realität (Migration 021, fuzzy.ts,
  objekte.kuerzel/einheiten.verwendungszweck_code, FIFO, konfigurierbare Schwellen).
- 001_erp: bestätigen dass Belegungs-Engine separat bleibt; ggf. kuerzel-Feld-Realität notieren.
