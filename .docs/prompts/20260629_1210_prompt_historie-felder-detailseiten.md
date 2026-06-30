# Bau-Auftrag: 009/008 Stufe 2 — HistorieTab + Custom-Field-Werte auf Detailseiten (2026-06-29 12:10 MESZ)

Voller Arbeitszyklus (CLAUDE.md, „check"). Backlog #14 (009 Stufe 2) + #14-Verweis aus 008.
NORMAL-Komplexität (mehrere Dateien, neue Komponente/API). Ein Aufwasch über dieselben
Detailseiten — zwei dezentrale Schichten andocken, die heute zentral/separat existieren.

## Ziel-Detailseiten (Kern-Entitäten)
Diese vier `app/(dashboard)/.../[id]/page.tsx` bekommen beides (HistorieTab + Custom Fields):
- `objekte/[id]` (bezugTyp "objekt", hatUntergeordnete=true)
- `einheiten/[id]` (bezugTyp "einheit", hatUntergeordnete=true)
- `kontakte/[id]` (bezugTyp "kontakt")
- `vorgaenge/[id]` (bezugTyp "vorgang")
> Weitere Detailseiten (fibu/finanzen/crm/…) sind NICHT Teil dieses Auftrags — bewusst auf die
> vier Kern-Entitäten begrenzt. Falls eine der vier real keinen passenden Tab-/Card-Slot hat,
> im Report parken statt erzwingen.

---

## TEIL A — HistorieTab einhängen (klein, fertige Komponente)
Die Komponente existiert vollständig: `components/historie/historie-tab.tsx`
→ `<HistorieTab bezugTyp={...} bezugId={id} hatUntergeordnete={...} />` (eigene API-Anbindung
`/api/historie?bezug_typ=&bezug_id=&inkl=`, Ebenen-Umschalter, Timeline). **Nur einhängen.**
- Auf jeder der vier Seiten als Reiter „Historie" (falls die Seite Tabs nutzt) ODER als Card/
  Abschnitt unten (falls nicht). Konsistent mit dem bestehenden Seitenaufbau — vorhandenes
  Tab-/Card-Muster der jeweiligen Seite referenzieren, nicht neu erfinden.
- `bezugTyp` exakt aus `lib/historie/types.ts` (BezugTyp) — reale Werte verifizieren.
- objekt/einheit: `hatUntergeordnete` true (zeigt Ebenen-Umschalter); kontakt/vorgang: default.

## TEIL B — Custom-Field-Werte auf Detailseiten (NEUBAU der UI-Schicht)
Service-Layer steht (server-only, `lib/felder/value.ts`): `getWerte(client, entitaet, entitaetId)`
+ `setWert(client, mandantId, defId, entitaet, entitaetId, roh)` (idempotenter Upsert, Typ-/Pflicht-
Validierung). Es FEHLT die UI + der Client-Zugriffsweg. Zu bauen:

1. **Definitionen-Loader prüfen/nutzen:** In `lib/felder/definition.ts` die Funktion finden, die
   die Custom-Field-*Definitionen* je Entität lädt (welche Felder existieren für „objekt" etc.).
   Real verifizieren (Name/Signatur) — NICHT raten. Falls nicht vorhanden, im Report parken.
2. **API-Route(n)** (server, da value.ts server-only): GET „Definitionen+Werte für entitaet/id"
   liefern, POST/PUT „Wert setzen" (ruft `setWert`). RLS/mandant über den Server-Client wie in
   den bestehenden `app/api/felder/*`-Routen (vorhandenes Muster referenzieren, nicht doppeln).
   mandantId serverseitig aus der Session, NIE vom Client.
3. **Anzeige-/Editor-Komponente** `components/felder/felder-werte.tsx` (o.ä.):
   - lädt Definitionen+Werte, rendert je `feldtyp` das passende Element: Text→Input, Zahl→Number-
     Input, Datum→Date-Picker, Auswahl→Select, Mehrfachauswahl→Multiselect, JaNein→Switch.
   - Speichern ruft die API (→ `setWert`); Pflichtfeld-Validierung + Fehlertext unter dem Feld
     (Design-System-Regel: Label über Input, Fehler unter Input).
   - Shadcn-Komponenten wiederverwenden (Input/Select/Switch/…), keine neuen UI-Primitives.
   - Leerer Zustand (keine Felder definiert) sauber: dezenter Hinweis + Link zu
     `/einstellungen/felder`, kein leerer Kasten.
4. **Einhängen** auf den vier Detailseiten als Abschnitt/Reiter „Felder" o.ä., konsistent zu
   TEIL A.

---

## HARTE Anforderungen
- **Nichts doppeln:** `getWerte`/`setWert` aus `lib/felder/value.ts` nutzen, KEINE zweite Wert-
  Logik. Definitionen über den bestehenden definition.ts-Loader. Bestehendes API-Muster
  (`app/api/felder/*`) referenzieren.
- **Reale Werte/Signaturen verifizieren:** BezugTyp-Enum, definition.ts-Loader, mandant-Quelle —
  alles am realen Code prüfen, nicht raten. Wo unklar → parken.
- **RLS/mandant_id:** alle Schreibwege serverseitig mandant-gebunden; Custom-Field-Werte erben
  Mandant wie in value.ts (mandantId-Param).
- **Design-System (CLAUDE.md):** Token-Farben, Label über Input, Fehler unter Input, Pflichtfeld
  *, Mobile 390px nutzbar (jede Detailseite mobil prüfen).
- **Keine Migration** (custom_field_*-Tabellen existieren seit 027; aktivitaeten seit 028). Falls
  doch ein Feld fehlt: NICHT raten, parken.

## Tests
- Unit: Editor-Komponente rendert je feldtyp das richtige Element; Pflichtfeld-Validierung greift;
  setWert-API ruft den Service korrekt (Mock). HistorieTab-Einhängung: Smoke je Seite (rendert,
  bezugTyp/bezugId korrekt durchgereicht).
- Kein Commit ohne grün (test:run + build).

## Report
`.docs/reports/JJJJMMTT_UHRZEIT_report_historie-felder-detailseiten.md` — 4 Punkte. Besonders:
welche der 4 Seiten real beides bekommen haben (Tab vs. Card je Seite), welcher definition.ts-
Loader genutzt wurde, was ggf. geparkt wurde (Seiten ohne passenden Slot, fehlende Loader etc.).
