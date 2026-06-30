# Auftrag Claude Code: Modul 004 (ops) aufbauen — Vorgangs-Engine + Umzug aus Kern

Das von Chat-Claude gelieferte `004_ops_*` ist aus Gedächtnis rekonstruiert und unzuverlässig
— **nicht als Wahrheit nehmen, ersetzen**. Baue Modul 004 sauber aus den echten Quellen neu.

## Quellen (Wahrheit)
1. Word-/Txt-Bestand unter `.docs/specs/ALT/word/` (Vorgangsmanagement, Übergaben, Reinigung,
   Wartung, Einsatzplanung, Dienstleister — Pfad ggf. anpassen).
2. Vorhandener Code (begonnener Vorgänge-Teilbereich) + Live-Schema `wimus`.
3. Aktuelle Specs `001_erp_*` (was steht heute im Kern zu Vorgängen).

## Kern-Architektur: EINE Vorgangs-Engine, Typen als Erweiterung

Vorgang = **generische Engine** mit vollem Funktionsumfang, den ALLE Typen erben.
NICHT Reinigung/Übergabe/Wartung als gleichrangige Parallelbereiche bauen (das war der
Fehler im verworfenen Entwurf) — sondern:

```
VORGANG (Engine, voller Funktionsumfang)
  ├─ Typ Reinigung  → + Zusatz (Turnaround, Inventar)      + eigene Mobile-Sicht
  ├─ Typ Übergabe   → + Zusatz (Zähler, Schlüssel, Unterschrift)
  ├─ Typ Wartung    → + Zusatz (Intervall, Prüfprotokoll)
  ├─ Typ Reparatur  → + Zusatz (Angebot, Abnahme)
  └─ Typ Schaden    → + Zusatz (Kategorie, Schwere)
```

**Engine-Funktionsumfang (gilt IMMER, für jeden Typ):**
- Bildaufnahme + **Vorher/Nachher-Bildabgleich** (auch Einzug/Auszug).
- **Automatische Benachrichtigung bei Statuswechsel** (an Mieter/Gast/Dienstleister via
  Channel-System).
- **Zuweisung intern** (Akteur) **+ extern** (Organisation/Dienstleister) mit Auftrag-Versand.
- **Eskalation** bei Notfall/Überfälligkeit.
- **Verlauf/Audit-Timeline**.
- **Kostenträger** (Mieter/Eigentümer/Versicherung) + Forderungs-/Beleg-Verknüpfung.
- **Checklisten/Pflichtfelder je Typ** (z.B. Pflichtfotos in Übergabe).

Typen sind dünne Erweiterungen (1:1-Zusatztabelle + UI-Sicht), keine eigene Logik, die die
Engine umgeht. „Reinigung heute" / „meine Aufträge" = **Sicht/Filter** auf die Engine, kein
eigenes Datenmodell.

## Umzug: Vorgänge aus Kern (0001) nach Modul 004

Vorgänge liegen aktuell im Kern. Vom Umfang her werden sie ein eigenes Modul (wie FiBu/CRM).
- **Ermittle selbst den Ist-Stand**: was existiert real in `001_erp_*` / Live-Schema / Code
  zu Vorgängen (`vorgaenge` + Bezüge).
- **Verschiebe** Vorgangs-Datenmodell/Prozesse/UI konzeptionell von 0001 → 004.
- Im **Kern bleibt nur der Verweis** „Vorgänge → Modul 004" + die Verknüpfungspunkte
  (Forderungen referenzieren Vorgänge, Fristen erzeugen Vorgänge, Akteure sind Träger).
- **Nichts doppelt**: Vorgänge dürfen nicht in 0001 UND 004 ausführlich stehen.
- Beide Module nachziehen (004 bekommt Inhalt, 0001 wird auf Verweis reduziert) — **beide mit
  Historie-Eintrag**.

## Aufgabe
1. **Git sichern** (Commit/Branch) vor jeder Änderung.
2. Modul 004 (`ops`) flach nach Konvention schreiben: `004_ops_DDD_name.md` (000 konzept,
   100 architektur, 200 datenmodell, 300 prozesse, 400 design, 500 migration, 600 tests).
   Regeln: `README.md` + `_PROMPT_spec-sync.md`. Charts: shadcn-charts. Querverweise als
   voller Dateiname. Nichts doppelt zu Kern (Fristen/Forderungen/Kaution/Akteure/DMS/
   organisationen referenzieren).
3. Kern (0001) bereinigen: Vorgangs-Teile → Verweis auf 004.
4. **Code entwickeln** für die in der Spec festgehaltenen, noch fehlenden Teile (Engine-
   Fähigkeiten zuerst, dann Typen). Migrationen idempotent (IF NOT EXISTS / ON CONFLICT
   DO NOTHING).
5. **Testen:** `npm run test:run` UND `npm run build` grün. **Kein Commit bei Rot** — melden.
6. `README.md` Modul-Index um 004 ergänzen.

## Pflicht bei JEDER Spec-Änderung (nicht vergessen)
- **Änderungshistorie** in der jeweiligen `*_000_konzept` (004 UND 0001): Tabelle
  `| Datum/Zeit | Vorgang | Betroffen |`, neueste oben, ≤ 100 Zeichen, Datum **+ Uhrzeit**.
- **Decision-Log** in `000_konzept`: jede Entscheidung datiert + begründet (nur ergänzen).
- **Meilenstein-Tabelle + Version** in `000_konzept` (Version nur dort).
- Jede Detaildatei aktuelles `geaendert:`-Datum.
- **Keine Modell-/Inhaltsänderung ohne Konzept-Nachtrag**.
- README-Index konsistent zur `000_konzept`.

## Vorgehen
Erst **Abgleich-Bericht** (Ist-Stand Vorgänge im Kern/Code/Bestand; was zur Engine gehört;
was nach 004 umzieht; was fehlt/widerspricht), DANN auf meine Freigabe Spec + Code schreiben.
Nichts blind überschreiben.
