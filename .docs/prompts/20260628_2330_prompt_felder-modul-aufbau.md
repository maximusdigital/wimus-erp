# Bau-Auftrag: Modul 008 (felder) — Custom-Field-Schicht + Kontaktmodell (2026-06-28 23:30 MESZ)

Voller Arbeitszyklus (CLAUDE.md, „check"). Vorab-Spec: `008_felder_000/200/300` in `.docs/specs/`.
Entscheidungsfest bis auf die BEWUSST offene Speicher-Variante (C vs. B) — die entscheidest DU an
realer Last und begründest im Report.

## Scope (Stufe 1)
1. **Kontaktmodell Person/Organisation:** reale `kontakte`-Struktur ZUERST prüfen (trennt sie
   Person/Firma? Migrationspfad). Person + Organisation als getrennte Objekte (oder vorhandenes
   erweitern), n:m-Verknüpfung (Ansprechpartner).
2. **Typen** (kontakt_typen + Zuordnung n:m): System-Typen geschützt (Mieter/Lieferant/
   Eigentümer — Code matcht stabilen key), freie per UI. Typ-Verwaltung `/einstellungen/kontakttypen`.
3. **Custom-Field-Definition** (custom_field_def + custom_field_option): Feldtypen Text/Zahl/
   Datum/Auswahl/Mehrfachauswahl/JaNein, stabiler key, geschuetzt/pflicht. UI `/einstellungen/felder`.
4. **Custom-Field-Werte — VARIANTE WÄHLEN (C Default vs. B):** beide in der Spec (§3 Datenmodell).
   C = typisierte Wert-Spalten (empfohlen), B = JSONB-Hybrid. An realer Last entscheiden, im
   Report begründen. HINTER Service-Schicht kapseln (`lib/felder/`), damit Wechsel die Konsumenten
   nicht bricht.
5. **Service-Schicht `lib/felder/`:** definition/value/typen/filter-adapter/types.
6. **Filter dockt an Modul 0006 an** (KEIN zweites Filtersystem): filter-adapter erzeugt dynamische
   filterFields aus custom_field_def; filter-bar (0006) zeigt sie; query-builder (0006) übersetzt.

## HARTE Anforderungen
- **Stabiler key, nie Label** (Code/Filter referenzieren key). Label umbenennbar.
- **geschuetzt serverseitig** schützen (Lösch-/Umbenenn-/Key-Guard, nicht nur UI).
- **RLS mandant_isolation** auf allen Tabellen; Werte erben Mandant der Entität.
- **Keine Doppelung:** vorhandene kontakte/fibu_lieferanten prüfen — „Lieferant" = Org-Typ ODER
  eigene Entität? Eine Wahrheit. Vorhandenes erweitern, nicht neu daneben.
- **Schlank:** KEIN volles CRM-Customizing (keine Formelfelder/Feldgruppen-Hierarchie/required-
  Workflows in Stufe 1).

## Empfehlung Reihenfolge
Person/Organisation-Trennung + Typen zuerst (konkreter Bedarf), dann generische Custom Fields +
0006-Andockung. Falls Umfang für einen Lauf zu groß: sauber bis zu einem Punkt + Rest im Report
parken. 0006-Spec-Ergänzung „dynamische Felder" im Report vermerken (Konzept-Claude zieht nach).

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_felder.md` — 4 Punkte. Besonders: reale kontakte-Struktur,
**gewählte Speicher-Variante C/B mit Begründung**, fibu_lieferanten-Klärung, 0006-Andockungsstand.
