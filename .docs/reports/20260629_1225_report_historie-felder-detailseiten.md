# Report: HistorieTab + Custom-Field-Werte auf Detailseiten (008/009 Stufe 2) — 2026-06-29 12:25 MESZ

Auftrag: `.docs/prompts/20260629_1210_prompt_historie-felder-detailseiten.md` (Backlog #14, 009
Stufe 2 + 008-Verweis). Voller Zyklus. Commit `8934ca7`. Tests 407 grün, Build grün.
Review-Subagent: **FREIGABE** (keine kritischen Findings).

## 1) Gebaut (mit echten Tabellen/Feldern)

Beide dezentralen Schichten auf **allen 4 Kern-Detailseiten** eingehängt — über einen gemeinsamen
Wrapper, konsistent als Card-Abschnitt unten (keine der Seiten nutzt Tabs):

| Seite | bezugTyp (Historie) | hatUntergeordnete | Felder-Entität |
|-------|---------------------|-------------------|----------------|
| `objekte/[id]` | objekt | ✓ | objekt |
| `einheiten/[id]` | einheit | ✓ | einheit |
| `kontakte/[id]` | kontakt | – | **person / organisation** (via `kontakt.kontakt_typ === "firma"`) |
| `vorgaenge/[id]` | vorgang | – | vorgang |

**TEIL A — HistorieTab:** Die fertige Komponente `components/historie/historie-tab.tsx`
(`bezugTyp`/`bezugId`/`hatUntergeordnete`, eigene `/api/historie`-Anbindung) nur eingehängt.
`bezugTyp` exakt aus `lib/historie/types.ts` (BezugTyp). objekt/einheit mit Ebenen-Umschalter.

**TEIL B — Custom-Field-Werte (neue UI-Schicht):**
- **API neu** `app/api/felder/werte/route.ts` (Muster aus `app/api/felder/route.ts`):
  - `GET ?entitaet=&id=` → `{ definitionen, werte }` via `listDefs()` + `getWerte()`.
  - `PUT { entitaet, id, def_id, wert }` → `setWert()`; `mandant_id` serverseitig aus
    `activeMandantId()` (`@/lib/crm/server`), NIE vom Client. Entität gegen `FELD_ENTITAETEN` validiert.
- **Editor neu** `components/felder/felder-werte.tsx`: lädt Definitionen+Werte, rendert je
  `feldtyp` das passende Element — text→Input, zahl→Number-Input, datum→Date-Input,
  auswahl→Select, mehrfachauswahl→Checkboxen, janein→Select(Ja/Nein). Pro-Feld-Speichern (PUT),
  Pflicht-Validierung (Fehler UNTER dem Feld), Lade-(Skeleton)/Fehler-/Leer-Zustand (Hinweis +
  Link `/einstellungen/felder`). Dirty-Check → kein redundanter Upsert bei Blur ohne Änderung.
- **Wrapper neu** `components/shared/detail-zusatz.tsx`: rendert „Weitere Felder" + „Historie" als
  selbst-enthaltenes 2-Spalten-Grid → eine Zeile je Detailseite.
- **Definitions-Loader genutzt:** `listDefs(client, entitaet)` aus `lib/felder/definition.ts` (real
  verifiziert). Werte: `getWerte`/`setWert` aus `lib/felder/value.ts` (keine zweite Wert-Logik).
  Roh-Formate je Feldtyp passend zu `lib/felder/mapping.ts.normalisiereWert`.

**Echte Felder/Enums:** `custom_field_definitionen`/`custom_field_werte`/`custom_field_option`
(über die Service-Schicht), `FELD_ENTITAETEN` (person/organisation/vorgang/objekt/einheit),
`FELDTYPEN` (6 Typen), `kontakte.kontakt_typ` (person|firma), `BezugTyp` (009).

**Tests (+6):** `felder-werte.test.tsx` (je Feldtyp das richtige Element; Pflichtfeld blockt +
kein PUT; Save mit korrektem Body; Leerzustand+Link) · `detail-zusatz.test.tsx` (beide Abschnitte;
bezugTyp/bezugId an Historie durchgereicht; Kontakt nutzt person-Entität).

## 2) Abweichungen (inkl. Review-Findings)

- **Card statt Tab:** keine der 4 Seiten nutzt ein Tab-Muster → HistorieTab + Felder als Card-
  Abschnitt unten (Prompt erlaubt „ODER als Card/Abschnitt unten"). Über `DetailZusatz` einheitlich.
- **Felder-Entität ≠ bezugTyp bei Kontakten:** Custom-Field-Entitäten kennen kein „kontakt", nur
  `person`/`organisation`. Daher Mapping `kontakt_typ === "firma" → organisation, sonst person`
  (real verifiziert: `KONTAKT_TYP` = person|firma). HistorieTab bleibt `bezugTyp="kontakt"`.
- Review-Finding (KLEIN, **behoben**): PUT feuerte bei jedem Blur (auch ohne Änderung) → Dirty-Check
  (JSON-Vergleich gegen zuletzt persistierten Wert) ergänzt.
- Review-Finding (KLEIN, **kein Handlungsbedarf**): `FieldDef.gruppe` wird geladen, aber nicht als
  Gruppen-Header gerendert — Spec 008 schließt Feldgruppen in dieser Stufe explizit aus (Z.46/96/129).
- Doku (`.docs/CLAUDE.md`, `_BACKLOG.md`, `_LOG.md`) von Konzept-Claude NICHT in den Commit
  aufgenommen.

## 3) Offen

- Weitere Detailseiten (fibu/finanzen/crm/…) bewusst NICHT Teil dieses Auftrags (Prompt: auf die 4
  Kern-Entitäten begrenzt).
- Feldgruppen-Darstellung / Sortierung nach `gruppe` = spätere Stufe (008-Roadmap).
- `vorgaenge/[id]` hat zusätzlich eine eigene „Verlauf"-Card (Vorgangs-Status-Historie) — bleibt
  bestehen neben der neuen Aktivitäts-Historie (zwei verschiedene Dinge; nicht zusammengelegt).

## 4) Rückfragen

- Keine blockierenden. Alle vier Seiten hatten einen passenden Card-Slot — nichts geparkt.
- Klärung gewünscht? Ob auf `kontakte/[id]` für Firmen-Kontakte zusätzlich der `organisation`-
  Bezug der Historie sinnvoll wäre (aktuell `bezugTyp="kontakt"` für beide Kontaktarten — konsistent
  mit dem 009-Bezugsmodell, das „kontakt" als Sammeltyp führt).
